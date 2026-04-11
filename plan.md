# Plan: Separate Landing Page and Auth Pages

Objective: Ensure the landing page is the entry point (root route), featuring a "Try Now" button linking to the public Create Escrow page, while keeping Login/Signup on a separate dedicated page.

## 1. Routing Updates (`src/App.tsx`)
- Change the root route (`/`) to render the `Landing` component.
- Move the `Dashboard` component to exclusively live at `/dashboard`.
- Ensure `/auth` remains its own route for Login/Signup.
- Verify all other routes (`/create`, `/pay/:id`, `/withdraw`, etc.) are correctly mapped.

## 2. Landing Page Enhancements (`src/pages/Landing.tsx`)
- Ensure the "Get Started" / "Try Now" button prominently links to `/create`.
- Maintain the existing design and animations.
- (Optional) Keep the auto-redirect to `/dashboard` for logged-in users to improve UX, or remove if a pure landing experience is preferred even for logged-in users. *Decision: Keep it for better UX.*

## 3. Navbar Adjustments (`src/components/Navbar.tsx`)
- Ensure the logo/brand link points to `/` (Landing).
- Confirm the "Login" button correctly navigates to `/auth`.
- Update navigation logic to reflect that `/` is no longer the dashboard.

## 4. Verification
- Visit `/` and confirm the Landing page loads.
- Click "Get Started" and confirm it goes to `/create`.
- Click "Login" in the Navbar and confirm it goes to `/auth`.
- Log in and confirm redirect to `/dashboard`.
