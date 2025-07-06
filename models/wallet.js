"use strict";

module.exports = (sequelize, DataTypes) => {
    const Wallet = sequelize.define("Wallet", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        wallet_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        balance: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
    }, {
        tableName: "wallets",
        underscored: true,
    });

    Wallet.associate = function(models) {
        Wallet.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        });
    };

    return Wallet;
};
