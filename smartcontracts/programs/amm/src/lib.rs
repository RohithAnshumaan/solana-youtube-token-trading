use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
};
use spl_token::state::Account as TokenAccount;

#[derive(BorshSerialize, BorshDeserialize, Debug, Default, PartialEq)]
pub struct Pool {
    pub is_initialized: bool,
    pub token_a_mint: Pubkey, // Mint of YT_TOKEN
    pub token_b_mint: Pubkey, // Mint of SOL or base token
    pub token_a_amount: u128, // Reserve of YT_TOKEN
    pub token_b_amount: u128, // Reserve of SOL
    pub k: u128,             // Constant product (token_a_amount * token_b_amount)
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let user_account = next_account_info(account_info_iter)?; // Signer account
    let pool_account = next_account_info(account_info_iter)?; // Pool account
    let token_a_account = next_account_info(account_info_iter)?; // Pool's token A account
    let token_b_account = next_account_info(account_info_iter)?; // Pool's token B account
    let user_token_a_authority = next_account_info(account_info_iter)?; // Signer for token A transfer
    let user_token_b_authority = next_account_info(account_info_iter)?; // Signer for token B transfer
    let user_token_a_account = next_account_info(account_info_iter)?; // User's token A account
    let user_token_b_account = next_account_info(account_info_iter)?; // User's token B account
    let token_program = next_account_info(account_info_iter)?; // SPL token program

    // Validate accounts
    if pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
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
            if instruction_data.len() != 1 + 16 + 16 { // u128 = 16 bytes
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

            // Convert u128 to u64 for SPL token transfers
            let amount_a_u64 = amount_a
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?; // Custom error for overflow
            let amount_b_u64 = amount_b
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            // Transfer tokens
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
                .ok_or(ProgramError::Custom(1001))?; // Overflow error
            pool.token_b_amount = pool
                .token_b_amount
                .checked_add(amount_b)
                .ok_or(ProgramError::Custom(1001))?;
            pool.k = pool.token_a_amount.checked_mul(pool.token_b_amount)
                .ok_or(ProgramError::Custom(1001))?;

            let serialized = pool.try_to_vec()?;
            if serialized.len() > pool_account.data.borrow().len() {
                return Err(ProgramError::InvalidAccountData);
            }
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
            msg!("Liquidity added: {} YT_TOKEN, {} SOL", amount_a, amount_b);
        }
        // Swap (YT_TOKEN -> SOL)
        2 => {
            if instruction_data.len() != 1 + 16 { // u128
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount_in: u128 = u128::from_le_bytes(
                instruction_data[1..17]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );

            let mut pool = Pool::try_from_slice(&pool_account.data.borrow())?;
            if !pool.is_initialized {
                return Err(ProgramError::UninitializedAccount);
            }

            let fee_numerator = 997;
            let fee_denominator = 1000;

            let amount_in_with_fee = amount_in
                .checked_mul(fee_numerator)
                .and_then(|x| x.checked_div(fee_denominator))
                .ok_or(ProgramError::Custom(1001))?;

            let output_amount = amount_in_with_fee
                .checked_mul(pool.token_b_amount)
                .and_then(|x| x.checked_div(pool.token_a_amount.checked_add(amount_in_with_fee)?))
                .ok_or(ProgramError::Custom(1001))?;

            let amount_out: u64 = output_amount
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            if amount_out == 0 || pool.token_b_amount < output_amount {
                return Err(ProgramError::InsufficientFunds);
            }

            let amount_in_u64: u64 = amount_in
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    user_token_a_account.key,
                    token_a_account.key,
                    user_account.key,
                    &[],
                    amount_in_u64,
                )?,
                &[
                    user_token_a_account.clone(),
                    token_a_account.clone(),
                    user_account.clone(),
                    token_program.clone(),
                ],
            )?;
            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    token_b_account.key,
                    user_token_b_account.key,
                    pool_account.key,
                    &[],
                    amount_out,
                )?,
                &[
                    token_b_account.clone(),
                    user_token_b_account.clone(),
                    pool_account.clone(),
                    token_program.clone(),
                ],
            )?;

            pool.token_a_amount = pool
                .token_a_amount
                .checked_add(amount_in)
                .ok_or(ProgramError::Custom(1001))?;
            pool.token_b_amount = pool
                .token_b_amount
                .checked_sub(output_amount)
                .ok_or(ProgramError::Custom(1001))?;
            pool.k = pool.token_a_amount.checked_mul(pool.token_b_amount)
                .ok_or(ProgramError::Custom(1001))?;

            let serialized = pool.try_to_vec()?;
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
            msg!("Swapped {} YT_TOKEN for {} SOL", amount_in, amount_out);
        }
        // Swap (SOL -> YT_TOKEN)
        3 => {
            if instruction_data.len() != 1 + 16 { // u128
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount_in: u128 = u128::from_le_bytes(
                instruction_data[1..17]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidInstructionData)?,
            );

            let mut pool = Pool::try_from_slice(&pool_account.data.borrow())?;
            if !pool.is_initialized {
                return Err(ProgramError::UninitializedAccount);
            }

            let fee_numerator = 997;
            let fee_denominator = 1000;

            let amount_in_with_fee = amount_in
                .checked_mul(fee_numerator)
                .and_then(|x| x.checked_div(fee_denominator))
                .ok_or(ProgramError::Custom(1001))?;

            let output_amount = amount_in_with_fee
                .checked_mul(pool.token_a_amount)
                .and_then(|x| x.checked_div(pool.token_b_amount.checked_add(amount_in_with_fee)?))
                .ok_or(ProgramError::Custom(1001))?;

            let amount_out: u64 = output_amount
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            if amount_out == 0 || pool.token_a_amount < output_amount {
                return Err(ProgramError::InsufficientFunds);
            }

            let amount_in_u64: u64 = amount_in
                .try_into()
                .map_err(|_| ProgramError::Custom(1000))?;

            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    user_token_b_account.key,
                    token_b_account.key,
                    user_account.key,
                    &[],
                    amount_in_u64,
                )?,
                &[
                    user_token_b_account.clone(),
                    token_b_account.clone(),
                    user_account.clone(),
                    token_program.clone(),
                ],
            )?;
            invoke(
                &spl_token::instruction::transfer(
                    token_program.key,
                    token_a_account.key,
                    user_token_a_account.key,
                    pool_account.key,
                    &[],
                    amount_out,
                )?,
                &[
                    token_a_account.clone(),
                    user_token_a_account.clone(),
                    pool_account.clone(),
                    token_program.clone(),
                ],
            )?;

            pool.token_b_amount = pool
                .token_b_amount
                .checked_add(amount_in)
                .ok_or(ProgramError::Custom(1001))?;
            pool.token_a_amount = pool
                .token_a_amount
                .checked_sub(output_amount)
                .ok_or(ProgramError::Custom(1001))?;
            pool.k = pool.token_a_amount.checked_mul(pool.token_b_amount)
                .ok_or(ProgramError::Custom(1001))?;

            let serialized = pool.try_to_vec()?;
            pool_account.data.borrow_mut()[..serialized.len()].copy_from_slice(&serialized);
            msg!("Swapped {} SOL for {} YT_TOKEN", amount_in, amount_out);
        }
        _ => return Err(ProgramError::InvalidInstructionData),
    }
    Ok(())
}