"use strict";

module.exports = (sequelize, DataTypes) => {
    const Otp = sequelize.define(
        "Otp",
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM("phone", "email"),
                allowNull: false,
            },
            verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "otps",
            timestamps: true,
            underscored: true,
        }
    );

    return Otp;
};
