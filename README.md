# Supabase Auth with SSR 🚀

Welcome to the Supabase Auth using SSR package repository! This project demonstrates seamless integration of authentication in Next.js projects utilizing Supabase's server-side rendering (SSR) capabilities.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
- [Usage](#-usage)
- [Email Templates](#-email-templates)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)
- [Packages Used](#-packages-used)

## Features

- **Robust Authentication**: Utilize Supabase's comprehensive auth capabilities alongside SSR for enhanced security.
- **Performance**: Leverage server-side rendering for faster load times and improved user experience.
- **Next.js Integration**: Specifically designed for seamless integration with Next.js 14 projects.

## Getting Started

### Prerequisites

- A [Supabase account](https://supabase.io/)
- An existing [Next.js](https://nextjs.org/) project setup

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd SupabaseAuthWithSSR
   ```

3. **Install Required Packages**

   ```bash
   npm install
   ```

### Database Setup

Before launching your application, you must configure the database schema within Supabase.

1. **Create the Users Table**

   Navigate to your Supabase project's SQL editor and execute:

   ```sql
   CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       full_name VARCHAR(255),
       email VARCHAR(255) UNIQUE NOT NULL
   );
   ```

2. **Insert an Example User**

   To test the authentication flow, insert an example user:

   ```sql
   INSERT INTO users (full_name, email) VALUES ('Jane Doe', 'jane.doe@example.com');
   ```

   Replace the placeholders with your desired test user's information.

3. **Enable Row Level Security (RLS)**

   Secure your data by enabling RLS and setting up a user-specific access policy:

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   CREATE POLICY user_is_owner ON users FOR SELECT USING (auth.uid() = id);
   ```

   Ensure that "New users can sign up" is enabled in your project's Auth settings. Find this option at `Settings > Auth` in your Supabase dashboard. For more details, visit [Supabase Auth Settings](https://supabase.com/docs/guides/auth).

### Environment Variables

Configure your environment by renaming `.env.local.example` to `.env.local` and updating it with your Supabase project details:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon (public) key.

Optional variables for extended functionality:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `NEXT_PUBLIC_CLIENT_ID`
- `CLIENT_SECRET`

For third-party auth configurations, include:

- `GITHUB_CLIENT_ID`
- `GITHUB_SECRET_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_SECRET_ID`

## 🔍 Usage

📖 Follow the provided examples to integrate Supabase Auth with SSR in your Next.js project.

## 📧 Email Templates

To ensure that the authentication flow works correctly with the API routes provided in this codebase, please update your email templates in the Supabase project settings according to the templates provided below:

### Confirm Your Signup

When users sign up, they'll receive an email to confirm their account. The template should look like this:

```html
<!doctype html>
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
      <a
        href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email"
        >Confirm your email</a
      >

      <div class="footer">
        <p>
          For any queries, reach out to us at
          <a href="mailto:support@nordiskapihub.com"
            >support@YourCompanyName.com</a
          >
        </p>
      </div>
    </div>
  </body>
</html>
```

Invite User Email When you invite new users to your platform, they should
receive an invitation like this:

```html
<h2>You have been invited</h2>
<p>
  You have been invited to create a user on {{ .SiteURL }}. Follow this link to
  accept the invite:
</p>
<a
  href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/auth-password-update"
  >Accept the invite</a
>
```

Magic Link Email For passwordless login, the magic link email template should be
set as follows:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<a
  href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=email"
  >Log In</a
>
```

Confirm Email Change When users need to confirm their new email, use the
following template:

```html
<h2>Confirm Change of Email</h2>
<p>
  Follow this link to confirm the update of your email from {{ .Email }} to {{
  .NewEmail }}:
</p>
<a href="{{ .ConfirmationURL }}">Change Email</a>
```

Reset Password Email For users that have requested a password reset:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<a
  href="{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth-password-update"
  >Reset Password</a
>
```

## 📜 License

🔖 Licensed under the MIT License. See LICENSE.md for details.

## 🙏 Acknowledgements

🎉 A special thank you to the Supabase team for developing such a versatile and user-friendly tool.
🛠 This project was built with TypeScript, leveraging the power of Supabase and the innovative @supabase/ssr package.

## 📦 Packages Used

- 🧰 Material-UI (`@mui/material`, `@mui/icons-material`): Provides a comprehensive suite of UI tools for React applications.
- 🛡 @hcaptcha/react-hcaptcha: Integrate hCaptcha for bot protection and spam prevention.
- 🎨 @emotion/react, @emotion/styled, @emotion/cache: CSS-in-JS libraries used for styling components in a more expressive and dynamic way.
- 🚀 @supabase/supabase-js, @supabase/ssr: Official Supabase client for JavaScript, enabling interaction with Supabase services including authentication, database queries, and more, with support for server-side rendering.
- 🖼 Next.js (`next`): A React framework for building server-rendered applications, static websites, and more.
- ⚛️ React (`react`, `react-dom`): A JavaScript library for building user interfaces.
- 🆕 @mui/material-nextjs: An experimental package for integrating Material-UI with Next.js projects.

Integrate hcaptcha from Supabase for added security and spam protection.
