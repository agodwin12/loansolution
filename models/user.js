"use strict";

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        password_hash: DataTypes.STRING,
        fcm_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profile_image_url: DataTypes.STRING,
        id_card_front_url: DataTypes.STRING,
        id_card_back_url: DataTypes.STRING,
    }, {
        tableName: "users",
        underscored: true,
    });

    User.associate = function(models) {
        User.hasOne(models.Wallet, {
            foreignKey: "user_id",
            as: "wallet",
        });

        User.hasMany(models.Loan, {
            foreignKey: "user_id",
            as: "loans",
        });
    };


    return User;
};
