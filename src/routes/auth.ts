import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";

import User from "../models/user";
import JWT from "jsonwebtoken";
import { checkAuth } from "../middlewares/checkAuth";
import { stripe } from "../utils/stripe";
const router = express.Router();
/*
         **** TODOS  signpup :) ***** 
        validate the email adn pass
        check if email already in use or not
        hash the password
        save the user in db
        sned back toke~n
*/
router.post(
  "/signup",
  body("email").isEmail().withMessage("galat email"),
  body("password").isLength({ min: 5 }).withMessage("galat password hai"),

  async (req, res) => {
    const validationErrors = validationResult(req);

    //if threre are some errors
    if (!validationErrors.isEmpty()) {
      const errors = validationErrors.array().map((error) => {
        return {
          msg: error.msg,
        };
      });
      return res.json({ errors, data: null });
    }

    // NO errors
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.json({
        errors: [
          {
            msg: "email already exists",
          },
        ],
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //stripe ke mail se coonnected email bhi genreate taki end payment me id rhe hamre pas
    const customer = await stripe.customers.create(
      {
        email,
      },
      {
        apiKey: process.env.STRIPE_SECRET_KEY,
      }
    );
    const newUser = await User.create({
      email,
      password: hashedPassword,
      stripeCustomerId: customer.id,
    });
    const token = await JWT.sign(
      { email: newUser.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: 360000,
      }
    );

    // res.json(user);
    res.json({
      errors: [],
      data: {
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          stripeCustomerId: customer.id,
        },
      },
    });
  }
);

/*  login route */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      errors: [
        {
          msg: "invalid credentials",
        },
      ],
      data: null,
    });
  }
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.json({
      errors: [
        {
          msg: "invalid credentials  or User not found",
        },
      ],
      data: null,
    });
  }

  const token = await JWT.sign(
    { email: user.email },
    process.env.JWT_SECRET as string,
    {
      expiresIn: 360000,
    }
  );

  return res.json({
    errors: [],
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
       // stripeCustomerId: user.stripeCustomer,
      },
    },
  });
});

router.get("/me", checkAuth, async (req, res) => {
  // res.send(req.user);
  const user = await User.findOne({ email: req.user });

  return res.json({
    errors: [],
    data: {
      user: {
        id: user._id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
      },
    },
  });
});

export default router;

