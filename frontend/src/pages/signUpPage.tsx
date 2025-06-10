export const SignUpPage = () => {
    async function onSubmit() {
        try {
            window.location.href = "http://localhost:8080/auth/google";
        } catch(e: any) {
            console.log(e)
        }
    }
    return(
        <>
            <button className="text-white" onClick={onSubmit}>Sign up with Google</button>
        </>
    )
}