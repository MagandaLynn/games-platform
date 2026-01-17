import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthButton() {
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
