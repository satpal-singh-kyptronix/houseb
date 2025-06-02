const mongoose = require("mongoose");

const blacklistTokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const BlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema);

module.exports = BlacklistModel;
