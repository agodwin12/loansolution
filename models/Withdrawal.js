// models/Withdrawal.js
"use strict";

module.exports = (sequelize, DataTypes) => {
    const Withdrawal = sequelize.define(
        "Withdrawal",
        {
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
                allowNull: false,
                references: {
                    model: "wallets",
                    key: "wallet_id",
                },
                onDelete: "CASCADE",
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: "processed", // or pending, rejected, etc.
            },
        },
        {
            tableName: "withdrawals",
            underscored: true,
        }
    );

    Withdrawal.associate = function (models) {
        Withdrawal.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
        });
        Withdrawal.belongsTo(models.Wallet, {
            foreignKey: "wallet_id",
            targetKey: "wallet_id",
            as: "wallet",
        });
    };

    return Withdrawal;
};
