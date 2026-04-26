const Medicine = require("../models/Medicine");

const seedSampleMedicines = async () => {
  const count = await Medicine.countDocuments();
  if (count > 0) return;
  const samples = [
    {
      med_name: "Paracetamol 500mg",
      med_desc: "Pain reliever and fever reducer",
      side_effects: "Nausea, rash (rare)",
      med_price: 25,
      med_quantity: 120,
    },
    {
      med_name: "Amoxicillin 250mg",
      med_desc: "Antibiotic for bacterial infections",
      side_effects: "Diarrhea, mild rash",
      med_price: 90,
      med_quantity: 60,
    },
    {
      med_name: "Cetirizine 10mg",
      med_desc: "Antihistamine for allergies",
      side_effects: "Drowsiness, dry mouth",
      med_price: 40,
      med_quantity: 200,
    },
    {
      med_name: "Ibuprofen 400mg",
      med_desc: "Anti-inflammatory pain reliever",
      side_effects: "Stomach upset, dizziness",
      med_price: 55,
      med_quantity: 0,
    },
    {
      med_name: "Vitamin D3 60K",
      med_desc: "Weekly vitamin D supplement",
      side_effects: "Generally well tolerated",
      med_price: 120,
      med_quantity: 75,
    },
    {
      med_name: "Pantoprazole 40mg",
      med_desc: "Acidity and reflux relief",
      side_effects: "Headache, constipation",
      med_price: 80,
      med_quantity: 90,
    },
  ];
  await Medicine.insertMany(samples);
  console.log("Seeded sample medicines.");
};

const getAllMedicines = async (req, res) => {
  try {
    await seedSampleMedicines();
    const medicines = await Medicine.find({});
    res.json(medicines);
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const searchMedicine = async (req, res) => {
  const { name } = req.query;
  try {
    const medicines = await Medicine.find({
      med_name: { $regex: name || "", $options: "i" },
    });
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

const addMedicine = async (req, res) => {
  try {
    const { med_name, med_desc, side_effects, med_price, med_quantity } =
      req.body;
    if (!med_name)
      return res.status(400).json({ message: "med_name is required" });
    const created = await Medicine.create({
      med_name,
      med_desc,
      side_effects,
      med_price,
      med_quantity,
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Failed to add medicine" });
  }
};

module.exports = {
  getAllMedicines,
  searchMedicine,
  addMedicine,
};
