import * as yup from 'yup';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schema = yup.object().shape({
      email: yup
        .string()
        .email()
        .required(),
      password: yup.string().required(),
    });

    try {
      await schema.validate(req.body);
    } catch (err) {
      return res
        .status(400)
        .json({ error: 'Validation fail', errors: err.errors });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id: user.id }, authConfig.tokenSecret, {
        expiresIn: authConfig.tokenExpiresAt,
      }),
    });
  }
}

export default new SessionController();
