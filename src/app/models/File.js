import Sequelize, { Model } from 'sequelize';
import { promisify } from 'util';
import { resolve } from 'path';
import { unlink, exists } from 'fs';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.APP_URL}/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    this.addHook('beforeDestroy', async file => {
      if (file.path) {
        const pathPath = `${resolve(
          __dirname,
          '..',
          '..',
          '..',
          'tmp',
          'uploads'
        )}/${file.path}`;

        if (await promisify(exists)(pathPath)) {
          await promisify(unlink)(pathPath);
        }
      }
    });

    return this;
  }
}

export default File;
