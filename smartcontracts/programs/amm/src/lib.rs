#[warn(unexpected_cfgs)]
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use spl_token::state::Account as TokenAccount;

#[derive(BorshSerialize, BorshDeserialize, Debug, Default, PartialEq)]
pub struct Pool {
    pub is_initialized: bool,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_amount: u128,
    pub token_b_amount: u128,
    pub k: u128,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let user_account = next_account_info(account_info_iter)?;
    let pool_account = next_account_info(account_info_iter)?;
    let token_a_account = next_account_info(account_info_iter)?;
    let token_b_account = next_account_info(account_info_iter)?;
    let user_token_a_authority = next_account_info(account_info_iter)?;
    let user_token_b_authority = next_account_info(account_info_iter)?;
    let user_token_a_account = next_account_info(account_info_iter)?;
    let user_token_b_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;

    if token_a_account.owner != &spl_token::id() || token_b_account.owner != &spl_token::id() {
        return Err(ProgramError::InvalidAccountData);
    }
    if !user_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if user_token_a_account.owner != &spl_token::id()
        || user_token_b_account.owner != &spl_token::id()
    {
        return Err(ProgramError::InvalidAccountData);
    }

    msg!("token_program.key = {}", token_program.key);
    msg!("&spl_token::id() = {}", &spl_token::id());

    if token_program.key != &spl_token::id() {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !user_token_a_authority.is_signer || !user_token_b_authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    match instruction_data[0] {
        // Initialize Pool
        0 => {
            if instruction_data.len() != 1 + 32 + 32 {
                return Err(ProgramError::InvalidInstructionData);
            }

            let token_a_mint = Pubkey::new_from_array(
                instruction_data[1..33]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );
            let token_b_mint = Pubkey::new_from_array(
                instruction_data[33..65]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );

            let (expected_pda, bump_seed) = Pubkey::find_program_address(
                &[b"amm", token_a_mint.as_ref(), token_b_mint.as_ref()],
                program_id,
            );

            if pool_account.key != &expected_pda {
                return Err(ProgramError::InvalidSeeds);
            }

            if pool_account.lamports() == 0 {
                let rent = Rent::get()?;
                let pool_space = Pool::default().try_to_vec()?.len();
                let lamports = rent.minimum_balance(pool_space);

                // Step 1: Fund the PDA
                invoke(
                    &system_instruction::transfer(user_account.key, pool_account.key, lamports),
                    &[
                        user_account.clone(),
                        pool_account.clone(),
                        system_program.clone(),
                    ],
                )?;

                // Step 2: Allocate space
                invoke_signed(
                    &system_instruction::allocate(pool_account.key, pool_space as u64),
                    &[pool_account.clone(), system_program.clone()],
                    &[&[
                        b"amm",
                        token_a_mint.as_ref(),
                        token_b_mint.as_ref(),
                        &[bump_seed],
                    ]],
                )?;

                // Step 3: Assign ownership
                invoke_signed(
                    &system_instruction::assign(pool_account.key, program_id),
                    &[pool_account.clone(), system_program.clone()],
                    &[&[
                        b"amm",
                        token_a_mint.as_ref(),
                        token_b_mint.as_ref(),
                        &[bump_seed],
                    ]],
                )?;
            }

            msg!("Pool_account.owner = {}", pool_account.owner);
            msg!("prograim_id = {}", program_id);

            if pool_account.owner != program_id {
                return Err(ProgramError::IncorrectProgramId);
            }

            let mut pool = Pool::try_from_slice(&pool_account.data.borrow())?;
            if pool.is_initialized {
                return Err(ProgramError::AccountAlreadyInitialized);
            }

            let token_a_data = TokenAccount::unpack(&token_a_account.data.borrow())?;
            let token_b_data = TokenAccount::unpack(&token_b_account.data.borrow())?;
            if token_a_data.mint != token_a_mint || token_b_data.mint != token_b_mint {
                return Err(ProgramError::InvalidAccountData);
            }

            pool.is_initialized = true;
            pool.token_a_mint = token_a_mint;
            pool.token_b_mint = token_b_mint;
            pool.token_a_amount = 0;
            pool.token_b_amount = 0;
            pool.k = 0;

            let serialized = pool.try_to_vec()?;
            if serialized.len() > pool_account.data.borrow().len() {
                return Err(ProgramError::InvalidAccountData);
            }
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
            msg!(
                "Pool initialized with mints: {}, {}",
                token_a_mint,
                token_b_mint
            );
        }

        // Add Liquidity
        1 => {
            if instruction_data.len() != 1 + 16 + 16 {
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount_a: u128 = u128::from_le_bytes(
                instruction_data[1..17]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );
            let amount_b: u128 = u128::from_le_bytes(
                instruction_data[17..33]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );

            let mut pool = Pool::try_from_slice(&pool_account.data.borrow())?;
            if !pool.is_initialized {
                return Err(ProgramError::UninitializedAccount);
            }

            let token_a_data = TokenAccount::unpack(&token_a_account.data.borrow())?;
            let token_b_data = TokenAccount::unpack(&token_b_account.data.borrow())?;
            if token_a_data.mint != pool.token_a_mint || token_b_data.mint != pool.token_b_mint {
                return Err(ProgramError::InvalidAccountData);
            }

            if amount_a == 0 || amount_b == 0 {
                return Err(ProgramError::InvalidArgument);
            }

            let amount_a_u64 = amount_a
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;
            let amount_b_u64 = amount_b
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            // Transfer Token A from user to pool
            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    user_token_a_account.key,
                    token_a_account.key,
                    user_token_a_authority.key,
                    &[],
                    amount_a_u64,
                )?,
                &[
                    user_token_a_account.clone(),
                    token_a_account.clone(),
                    user_token_a_authority.clone(),
                    token_program.clone(),
                ],
            )?;

            // Transfer Token B from user to pool
            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    user_token_b_account.key,
                    token_b_account.key,
                    user_token_b_authority.key,
                    &[],
                    amount_b_u64,
                )?,
                &[
                    user_token_b_account.clone(),
                    token_b_account.clone(),
                    user_token_b_authority.clone(),
                    token_program.clone(),
                ],
            )?;

            pool.token_a_amount = pool
                .token_a_amount
                .checked_add(amount_a)
                .ok_or(ProgramError::Custom(1001))?;
            pool.token_b_amount = pool
                .token_b_amount
                .checked_add(amount_b)
                .ok_or(ProgramError::Custom(1001))?;
            pool.k = pool
                .token_a_amount
                .checked_mul(pool.token_b_amount)
                .ok_or(ProgramError::Custom(1001))?;

            let serialized = pool.try_to_vec()?;
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
            msg!("Liquidity added: {} A, {} B", amount_a, amount_b);
        }

        // Fixed Swap Logic
        2 | 3 => {
            let is_token_to_sol = instruction_data[0] == 2;
            let amount_in: u128 = u128::from_le_bytes(
                instruction_data[1..17]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );

            let mut pool = Pool::try_from_slice(&pool_account.data.borrow())?;
            if !pool.is_initialized {
                return Err(ProgramError::UninitializedAccount);
            }

            let (pda, bump_seed) = Pubkey::find_program_address(
                &[
                    b"amm",
                    pool.token_a_mint.as_ref(),
                    pool.token_b_mint.as_ref(),
                ],
                program_id,
            );

            let fee_numerator = 997;
            let fee_denominator = 1000;
            let amount_in_with_fee = amount_in
                .checked_mul(fee_numerator)
                .and_then(|x| x.checked_div(fee_denominator))
                .ok_or(ProgramError::Custom(1001))?;

            let amount_in_u64: u64 = amount_in
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            if is_token_to_sol {
                // Token A (YT_TOKEN) to Token B (WSOL)
                let output_amount = amount_in_with_fee
                    .checked_mul(pool.token_b_amount)
                    .and_then(|x| {
                        x.checked_div(pool.token_a_amount.checked_add(amount_in_with_fee)?)
                    })
                    .ok_or(ProgramError::Custom(1001))?;

                let amount_out_u64: u64 = output_amount
                    .try_into()
                    .map_err(|_| ProgramError::Custom(1000))?;

                // Transfer YT_TOKEN from user to pool
                invoke(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        user_token_a_account.key, // User's YT_TOKEN account
                        token_a_account.key,      // Pool's YT_TOKEN account
                        user_token_a_authority.key, // User authority
                        &[],
                        amount_in_u64,
                    )?,
                    &[
                        user_token_a_account.clone(),
                        token_a_account.clone(),
                        user_token_a_authority.clone(),
                        token_program.clone(),
                    ],
                )?;

                // Transfer WSOL from pool to user with PDA
                invoke_signed(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        token_b_account.key,      // Pool's WSOL account
                        user_token_b_account.key, // User's WSOL account
                        pool_account.key,         // Pool PDA authority
                        &[],
                        amount_out_u64,
                    )?,
                    &[
                        token_b_account.clone(),
                        user_token_b_account.clone(),
                        pool_account.clone(),
                        token_program.clone(),
                    ],
                    &[&[
                        b"amm",
                        pool.token_a_mint.as_ref(),
                        pool.token_b_mint.as_ref(),
                        &[bump_seed],
                    ]],
                )?;

                // Update pool amounts
                pool.token_a_amount = pool
                    .token_a_amount
                    .checked_add(amount_in)
                    .ok_or(ProgramError::Custom(1001))?;
                pool.token_b_amount = pool
                    .token_b_amount
                    .checked_sub(output_amount)
                    .ok_or(ProgramError::Custom(1001))?;

                msg!(
                    "Swapped {} YT_TOKEN for {} WSOL",
                    amount_in_u64,
                    amount_out_u64
                );
            } else {
                // Token B (WSOL) to Token A (YT_TOKEN)
                let output_amount = amount_in_with_fee
                    .checked_mul(pool.token_a_amount)
                    .and_then(|x| {
                        x.checked_div(pool.token_b_amount.checked_add(amount_in_with_fee)?)
                    })
                    .ok_or(ProgramError::Custom(1001))?;

                let amount_out_u64: u64 = output_amount
                    .try_into()
                    .map_err(|_| ProgramError::Custom(1000))?;

                // Transfer WSOL from user to pool
                invoke(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        user_token_b_account.key,   // User's WSOL account
                        token_b_account.key,        // Pool's WSOL account
                        user_token_b_authority.key, // User authority
                        &[],
                        amount_in_u64,
                    )?,
                    &[
                        user_token_b_account.clone(),
                        token_b_account.clone(),
                        user_token_b_authority.clone(),
                        token_program.clone(),
                    ],
                )?;

                // Transfer YT_TOKEN from pool to user with PDA
                invoke_signed(
                    &spl_token::instruction::transfer(
                        token_program.key,
                        token_a_account.key,      // Pool's YT_TOKEN account
                        user_token_a_account.key, // User's YT_TOKEN account
                        pool_account.key,         // Pool PDA authority
                        &[],
                        amount_out_u64,
                    )?,
                    &[
                        token_a_account.clone(),
                        user_token_a_account.clone(),
                        pool_account.clone(),
                        token_program.clone(),
                    ],
                    &[&[
                        b"amm",
                        pool.token_a_mint.as_ref(),
                        pool.token_b_mint.as_ref(),
                        &[bump_seed],
                    ]],
                )?;

                // Update pool amounts
                pool.token_b_amount = pool
                    .token_b_amount
                    .checked_add(amount_in)
                    .ok_or(ProgramError::Custom(1001))?;
                pool.token_a_amount = pool
                    .token_a_amount
                    .checked_sub(output_amount)
                    .ok_or(ProgramError::Custom(1001))?;

                msg!(
                    "Swapped {} WSOL for {} YT_TOKEN",
                    amount_in_u64,
                    amount_out_u64
                );
            }

            // Update k constant
            pool.k = pool
                .token_a_amount
                .checked_mul(pool.token_b_amount)
                .ok_or(ProgramError::Custom(1001))?;

            // Serialize and save pool state
            let serialized = pool.try_to_vec()?;
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
        }

        _ => return Err(ProgramError::InvalidInstructionData),
    }

    Ok(())
}
