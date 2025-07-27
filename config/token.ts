// Free user token configuration
export const FREE_USER_TOKENS = 30000 // 5 minutes, cost ~$1.98

export const TOKENS_PER_SECOND = 100 // Tokens per second

export const SUBSCRIPTION_PLANS = [
  {
    id: '7fae5433-a091-4b8d-91c9-ec147f38170b',
    name: 'Light Plan',
    price: 4.99,
    tokens: 100000 // 17 minutes
  },
  {
    id: 'f3e24b3f-96ec-4e6e-b653-50425f940aab',
    name: 'Standard Plan',
    price: 14.99,
    tokens: 400000 // 67 minutes
  },
  {
    id: 'fd6d5795-853a-421a-ba6b-ea76332b49cf',
    name: 'Professional Plan',
    price: 39.99,
    tokens: 1200000 // 200 minutes
  }
]

// Token packages configuration (one-time purchase)
export const TOKEN_PACKAGES = [
  {
    id: 'fdf2240f-5e81-4f56-9ef1-9da446965827',
    name: 'Trial Pack',
    price: 2.99,
    tokens: 30000 // 5 minutes
  },
  {
    id: '084c2ee1-1c5f-4c36-baae-b3b61bae6a12"',
    name: 'Small Pack',
    price: 9.99,
    tokens: 150000 // 25 minutes
  },
  {
    id: '61685d92-c00a-4424-aa5a-46be191d530d',
    name: 'Medium Pack',
    price: 24.99,
    tokens: 400000 // 67 minutes
  }
]
