module.exports = {
  up: queryInterface => {
    return queryInterface.removeColumn('meetups', 'banner');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('meetups', 'banner', {
      type: Sequelize.STRING,
    });
  },
};
