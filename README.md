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
- [Chat Interface Integration](#chat-interface-integration)
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
   CREATE TABLE public.users (
       id uuid not null,
       full_name VARCHAR(255) DEFAULT 'UserName_Default',
       email VARCHAR(255) UNIQUE NOT NULL
   );
   ```

2. **Enable Row Level Security (RLS)**

   Secure your data by enabling RLS and setting up a user-specific access policy:

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;

   CREATE POLICY user_is_owner ON users FOR SELECT USING (auth.uid() = id);
   ```

   Ensure that "New users can sign up" is enabled in your project's Auth settings. Find this option at `Settings > Auth` in your Supabase dashboard. For more details, visit [Supabase Auth Settings](https://supabase.com/docs/guides/auth).

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY insert_for_auth_users ON public.users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   CREATE POLICY user_is_owner ON public.users FOR SELECT USING (auth.uid() = id);
   ```

3. **Sign Up for an Account**

   - Navigate to `http://localhost:3000/auth` in your web browser.
   - Use the sign-up form to create an account. Ensure you use a valid email address that you have access to, as you'll need to verify it in the next step.

4. **Verify Your Email**

   - After signing up, Supabase will send an email to the address you provided. Check your inbox for an email from Supabase or your application.
   - Open the email and click on the verification link to confirm your email address. This step is crucial for activating your account and ensuring that you can log in and access the application's features.

## Setting Up the Waitlist Database in Supabase OPTIONAL

### Step 1: Create the `waiting_list` Table

Execute this SQL query in your Supabase SQL editor to create the `waiting_list` table:

```sql
CREATE TABLE waiting_list (
id BIGSERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
fullname TEXT,
erhverv TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Configure Row Level Security (RLS)

1. **Enable RLS for the `waiting_list` table**:

   - Go to the `Authentication` > `Policies` section of your Supabase project dashboard.
   - Select your `waiting_list` table and toggle on RLS.

2. **Create an RLS policy for inserts**:
   - Still under `Policies`, click "New Policy".
   - Set the **Policy Name** to `Allow user inserts`.
   - For **Policy Definition**, choose `INSERT` as the action.
   - Use `(auth.role() = 'authenticated')` for the **Using expression**.
   - Leave the **Check expression** blank or adjust it according to your requirements.
   - Finalize by setting the **Policy Command** to `INSERT`.

This setup allows authenticated users to insert new entries into the `waiting_list` table while preventing them from reading other entries.

## Setting Up the Error Feedback Database in Supabase OPTIONAL

### Step 1: Create the `error_feedback` Table

To store error feedback data, execute this SQL query in your Supabase SQL editor:

```sql
CREATE TABLE error_feedback (
    id BIGSERIAL PRIMARY KEY,
    feedback TEXT NOT NULL,
    category TEXT,
    errorMessage TEXT,
    errorStack TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This table will store feedback messages, their categories, any associated error messages, and the error stack trace to help with debugging.

### Step 2: Configure Row Level Security (RLS)

1. **Enable RLS for the `error_feedback` table**:

   - Navigate to `Authentication` > `Policies` in your Supabase project dashboard.
   - Select the `error_feedback` table and enable RLS.

2. **Create an RLS policy for inserts (Optional)**:
   - If you want to restrict who can insert data into this table, you can create a policy.
   - Click "New Policy", provide a name like `Allow feedback insertion`.
   - Set the **Policy Definition** to allow `INSERT` operations.
   - For the **Using expression**, you could use `(auth.role() = 'authenticated')` to only allow authenticated users to insert feedback.
   - Leave the **Check expression** as is if no further restrictions are needed or adjust according to your requirements.
   - Ensure the **Policy Command** is set to `INSERT`.

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

For Openai, Perplexity and Upstash/Redis

- `PERPLEXITY_API_KEY=`
- `OPENAI_API_KEY=`
- `UPSTASH_REDIS_REST_URL=`
- `UPSTASH_REDIS_REST_TOKEN=`

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

## Chat Interface Integration

### OpenAI and Perplexity API

This project includes integration with OpenAI and Perplexity API endpoints for powering an advanced chat interface. Users can interact with an AI model, with the option to switch between different models or APIs for varied responses.

### Upstash Redis for Chat History

Chat conversations are stored and managed using Upstash Redis, allowing for efficient retrieval of chat history. This ensures users can access previous conversations, enhancing the chat experience.

### Implementation

To integrate the chat features:

1. **Set Up API Routes**: Create API routes in your Next.js project for interacting with OpenAI and Perplexity API.

2. **Configure Upstash Redis**: Set up Upstash Redis for storing chat conversations. Ensure environment variables for Upstash Redis are correctly configured.

3. **Update the Chat Interface**: Utilize the provided chat interface component, adjusting the API endpoint based on the selected model type.

## 📜 License

🔖 Licensed under the MIT License. See LICENSE.md for details.

## 🙏 Acknowledgements

- 🎉 A special thank you to the **Supabase team** for developing such a versatile and user-friendly tool. Their commitment to making database interaction seamless and efficient has greatly enhanced this project.
- 🛠 Appreciation goes to **TypeScript** for its powerful type system that makes JavaScript code safer and easier to understand. This project leverages TypeScript to ensure code reliability and maintainability.
- 🌐 Thanks to **Vercel** for their innovative platform and tools like `@vercel/ai`, which simplify the deployment process and enhance the integration of AI features into web applications.
- 🤖 Gratitude to **Langchain** for their toolkit that makes it easier to build language AI applications, enabling this project to integrate complex AI functionalities with ease.
- 💡 This project also benefits from the innovative `@supabase/ssr` package, which seamlessly integrates Supabase authentication with Next.js server-side rendering, providing a robust foundation for secure and efficient user authentication.

Each of these contributions has been invaluable in creating a comprehensive, secure, and user-friendly application. Thank you for your tools, services, and the community support that makes projects like this possible.

## 📦 Packages Used

- 🧰 Material-UI (`@mui/material`, `@mui/icons-material`): Provides a comprehensive suite of UI tools for React applications.
- 🎨 @emotion/react, @emotion/styled, @emotion/cache: CSS-in-JS libraries used for styling components in a more expressive and dynamic way.
- 🚀 @supabase/supabase-js, @supabase/ssr: Official Supabase client for JavaScript, enabling interaction with Supabase services including authentication, database queries, and more, with support for server-side rendering.
- 🖼 Next.js (`next`): A React framework for building server-rendered applications, static websites, and more.
- ⚛️ React (`react`, `react-dom`): A JavaScript library for building user interfaces.
- 🆕 @mui/material-nextjs: An experimental package for integrating Material-UI with Next.js projects.
- 🤖 Langchain (`langchain`): A toolkit for building language AI applications, simplifying the integration of large language models.
- 🧠 AI by Vercel (`@vercel/ai`): Provides easy access to AI tools and models directly within the Vercel platform.
- 📝 React Markdown (`react-markdown`): A component to render Markdown text in React applications, used for formatting chat messages.

Each package plays a crucial role in building, styling, and securing the application, ensuring a seamless user experience and robust functionality.
