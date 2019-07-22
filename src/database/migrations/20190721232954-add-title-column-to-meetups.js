module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('meetups', 'title', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'no title defined',
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('meetups', 'title');
  },
};
