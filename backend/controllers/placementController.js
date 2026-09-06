exports.getPlacements = (req, res) => {
  res.json([
    {
      company: "TCS",
      appeared: 120,
      selected: 25,
      package: 7
    }
  ]);
};
