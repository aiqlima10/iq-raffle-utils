/ raffleSystem.js

import mongoose from 'mongoose';
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

// Define the Raffle model
const raffleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  entries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Entry' }]
});

const Raffle = mongoose.model('Raffle', raffleSchema);

// Define the Entry model
const entrySchema = new mongoose.Schema({
  raffle: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketNumber: { type: Number, required: true }
});

const Entry = mongoose.model('Entry', entrySchema);

// Configure NextAuth
export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        const user = await User.findOne({ email: credentials.username });
        if (!user) {
          throw new Error('Invalid username or password');
        }
        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          throw new Error('Invalid username or password');
        }
        return user;
      }
    })
  ],

  // Configure session management
  session: {
    jwt: true,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  // Configure callbacks
  callbacks: {
    async jwt(token, user, account, profile, isNewUser) {
      // Add custom claims to the JWT token
      return {
        sub: user.id,
        name: user.name,
        email: user.email
      };
    },
    async session(session, token, user) {
      []
      // Add custom session data
      session.user = user;
      return session;
    }
  },

  // API routes
  async createRaffle(req, res) {
    const { name, description, startDate, endDate } = req.body;
    const raffle = new Raffle({ name, description, startDate, endDate });
    try {
      await raffle.save();
      res.status(201).json({ message: 'Raffle created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating raffle' });
    }
  },

  async getRaffle(req, res) {
    const id = req.query.id;
    const raffle = await Raffle.findById(id);
    if (!raffle) {
      res.status(404).json({ message: 'Raffle not found' });
    }
    res.status(200).json({ raffle });
  },

  async enterRaffle(req, res) {
    const { raffleId, userId } = req.body;
    const entry = new Entry({ raffle: raffleId, user: userId, ticketNumber: Math.floor(Math.random() * 100) });
    try {
      await entry.save();
      res.status(201).json({ message: 'Entry created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating entry' });
    }
  }
});
