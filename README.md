# Supabase Auth with SSR 🚀

🎉 Welcome to the Supabase Auth using the SSR package repository! This project showcases how to effortlessly integrate authentication in your Next.js projects using the power of Supabase and its new server-side rendering (SSR) capabilities.

## 🚀 Table of Contents

- [🌟 Features](#-features)
- [🛠 Getting Started](#-getting-started)
  - [🔧 Prerequisites](#-prerequisites)
  - [💽 Installation](#-installation)
- [🔍 Usage](#-usage)
- [🤝 Contribute](#-contribute)
- [📜 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)
- [📦 Packages Used](#-packages-used)

## 🌟 Features

- **🔐 Robust Authentication**: Leverage Supabase's auth capabilities with the power of SSR.
- **⚡ Speedy Responses**: Reduce client-side code and improve performance using SSR.
- **🌐 Built for Next.js**: Tailored specifically for Next.js 14 projects, making integration a breeze.

## 🛠 Getting Started

### 🔧 Prerequisites

- A [Supabase account](https://supabase.io/)
- [Next.js](https://nextjs.org/) project setup

### 💽 Installation

1. **Clone this repository**

```bash
git clone https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR.git

📂 Navigate to the project directory and install the required packages.
cd SupabaseAuthWithSSR
npm install

🔑 Set up your environment variables:

Rename the .env.local.example file to .env.local and fill in the necessary values.

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# Github configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_SECRET_ID=your_github_secret_id

# Google configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_SECRET_ID=your_google_secret_id


```

## 🔍 Usage
📖 Follow the provided examples to integrate Supabase Auth with SSR in your Next.js project.

## 📧 Email Templates

To ensure that the authentication flow works correctly with the API routes provided in this codebase, please update your email templates in the Supabase project settings according to the templates provided below:

### Confirm Your Signup

When users sign up, they'll receive an email to confirm their account. The template should look like this:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Confirm Your Signup</title>
    <!-- Add styles and head content here -->
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Welcome to You Company Name</h1>
    </div>

    <h2>Confirm your signup</h2>
    <p>Follow this link to confirm your user:</p>
    <a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>

    <div class="footer">
        <p>For any queries, reach out to us at <a href="mailto:support@nordiskapihub.com">support@YourCompanyName.com</a></p>
    </div>
</div>
</body>
</html>

Invite User Email
When you invite new users to your platform, they should receive an invitation like this:

<h2>You have been invited</h2>
<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/auth-password-update">Accept the invite</a>

Magic Link Email
For passwordless login, the magic link email template should be set as follows:

<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a>

Confirm Email Change
When users need to confirm their new email, use the following template:

<h2>Confirm Change of Email</h2>
<p>Follow this link to confirm the update of your email from {{ .Email }} to {{ .NewEmail }}:</p>
<a href="{{ .ConfirmationURL }}">Change Email</a>

Reset Password Email
For users that have requested a password reset:

<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<a href="{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth-password-update">Reset Password</a>

```



## 📜 License
🔖 Licensed under the MIT License. See LICENSE.md for details.

## 🙏 Acknowledgements

🎉 A special thank you to the Supabase team for developing such a versatile and user-friendly tool.
🛠 This project was built with TypeScript, leveraging the power of Supabase and the innovative @supabase/ssr package.

## 📦 Packages Used:

🧰 Material-UI
🛡 @hcaptcha/react-hcaptcha

Integrate hcaptcha from Supabase for added security and spam protection.