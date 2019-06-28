import Sequelize, { Model } from 'sequelize';
import { promisify } from 'util';
import { resolve } from 'path';
import { unlink } from 'fs';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        description: Sequelize.STRING,
        location: Sequelize.STRING,
        date: Sequelize.DATE,
        banner: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeDestroy', async meetup => {
      if (meetup.banner) {
        const bannerPath = `${resolve(
          __dirname,
          '..',
          '..',
          '..',
          'tmp',
          'uploads'
        )}/${meetup.banner}`;

        await promisify(unlink)(bannerPath);
      }
    });

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

export default Meetup;
