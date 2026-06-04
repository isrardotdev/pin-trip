import { PrismaClient, Category } from '@prisma/client'

const prisma = new PrismaClient()

const discoverPlaces = [
  // Himachal Pradesh
  { name: 'Jibhi', city: 'Jibhi', state: 'Himachal Pradesh', lat: 31.5378, lng: 77.1828, category: Category.NATURE, description: 'A serene valley with dense forests, waterfalls, and the tranquil Tirthan river nearby.', tags: ['mountains', 'forests', 'offbeat', 'river'], photoUrl: null },
  { name: 'Kasol', city: 'Kasol', state: 'Himachal Pradesh', lat: 32.0088, lng: 77.3148, category: Category.NATURE, description: 'Known as mini-Israel, a picturesque village on the banks of Parvati River.', tags: ['trekking', 'river', 'backpacking', 'mountains'], photoUrl: null },
  { name: 'Tirthan Valley', city: 'Tirthan', state: 'Himachal Pradesh', lat: 31.5736, lng: 77.2196, category: Category.NATURE, description: 'A pristine valley known for trout fishing, camping, and the Great Himalayan National Park.', tags: ['nature', 'trekking', 'wildlife', 'camping'], photoUrl: null },
  { name: 'Chitkul', city: 'Chitkul', state: 'Himachal Pradesh', lat: 31.3493, lng: 78.4415, category: Category.OFFBEAT, description: 'The last inhabited village near the Indo-Tibetan border, with dramatic Himalayan views.', tags: ['border village', 'mountains', 'offbeat', 'snow'], photoUrl: null },

  // Northeast India
  { name: 'Dawki River', city: 'Dawki', state: 'Meghalaya', lat: 25.1854, lng: 92.0246, category: Category.NATURE, description: 'Famous for its crystal-clear waters where boats appear to float on air above the riverbed.', tags: ['river', 'crystal water', 'boating', 'scenic'], photoUrl: null },
  { name: 'Majuli Island', city: 'Majuli', state: 'Assam', lat: 26.9500, lng: 94.1667, category: Category.CULTURE, description: "The world's largest river island, home to vibrant Vaishnavite monasteries and Mising tribal culture.", tags: ['culture', 'island', 'monastery', 'tribal'], photoUrl: null },
  { name: 'Ziro Valley', city: 'Ziro', state: 'Arunachal Pradesh', lat: 27.5400, lng: 93.8350, category: Category.CULTURE, description: 'A UNESCO World Heritage tentative site, home to the Apatani tribe with lush pine forests.', tags: ['UNESCO', 'tribal', 'music festival', 'offbeat'], photoUrl: null },
  { name: 'Mawlynnong', city: 'Mawlynnong', state: 'Meghalaya', lat: 25.2006, lng: 91.8961, category: Category.OFFBEAT, description: "Asia's cleanest village, known for living root bridges and lush greenery.", tags: ['cleanest village', 'root bridges', 'nature', 'unique'], photoUrl: null },
  { name: 'Dzukou Valley', city: 'Kohima', state: 'Nagaland', lat: 25.5436, lng: 94.0824, category: Category.NATURE, description: 'A valley of flowers at 2,452m, one of the most scenic valleys in Northeast India.', tags: ['trekking', 'flowers', 'camping', 'mountains'], photoUrl: null },

  // Rajasthan
  { name: 'Jaisalmer Fort', city: 'Jaisalmer', state: 'Rajasthan', lat: 26.9124, lng: 70.9073, category: Category.CULTURE, description: 'The Golden Fort rising from the Thar Desert, a living fort with shops, hotels, and havelis inside.', tags: ['fort', 'desert', 'heritage', 'golden city'], photoUrl: null },
  { name: 'Bundi', city: 'Bundi', state: 'Rajasthan', lat: 25.4431, lng: 75.6470, category: Category.CULTURE, description: 'An offbeat Rajasthan town known for its step-wells, murals, and the stunning Taragarh Fort.', tags: ['offbeat', 'heritage', 'step-wells', 'murals'], photoUrl: null },
  { name: 'Sam Sand Dunes', city: 'Jaisalmer', state: 'Rajasthan', lat: 26.8696, lng: 70.5648, category: Category.ADVENTURE, description: 'Spectacular sand dunes at the edge of Thar Desert, ideal for camel safaris and desert camping.', tags: ['desert', 'camping', 'camel safari', 'sunset'], photoUrl: null },

  // Goa
  { name: 'Galgibaga Beach', city: 'Canacona', state: 'Goa', lat: 14.9671, lng: 74.0613, category: Category.NATURE, description: "Goa's cleanest and most serene beach, a protected nesting site for Olive Ridley turtles.", tags: ['beach', 'turtles', 'peaceful', 'nature'], photoUrl: null },
  { name: 'Agonda Beach', city: 'Agonda', state: 'Goa', lat: 15.0440, lng: 73.9964, category: Category.NATURE, description: 'A tranquil crescent-shaped beach away from the crowds, perfect for long walks and sunsets.', tags: ['beach', 'sunset', 'peaceful', 'dolphins'], photoUrl: null },
  { name: 'Dudhsagar Falls', city: 'Mollem', state: 'Goa', lat: 15.3144, lng: 74.3144, category: Category.NATURE, description: "India's second tallest waterfall, a four-tiered giant visible from the railway line.", tags: ['waterfall', 'trekking', 'nature', 'railway'], photoUrl: null },

  // Uttarakhand
  { name: 'Chopta', city: 'Chopta', state: 'Uttarakhand', lat: 30.4244, lng: 79.2214, category: Category.NATURE, description: "Mini Switzerland of India, the base for Tungnath — the world's highest Shiva temple.", tags: ['mountains', 'meadows', 'trekking', 'temple'], photoUrl: null },
  { name: 'Munsiyari', city: 'Munsiyari', state: 'Uttarakhand', lat: 30.0669, lng: 80.2387, category: Category.OFFBEAT, description: 'A hidden gem at 2,298m offering views of the Panchachuli peaks and gateway to Milam Glacier.', tags: ['mountains', 'glacier', 'offbeat', 'trekking'], photoUrl: null },
  { name: 'Har Ki Dun', city: 'Sankri', state: 'Uttarakhand', lat: 31.1478, lng: 78.4131, category: Category.ADVENTURE, description: 'An ancient cradle-shaped hanging valley, one of the most accessible high-altitude treks in India.', tags: ['trekking', 'valley', 'camping', 'snow'], photoUrl: null },

  // Andaman
  { name: 'Neil Island', city: 'Neil Island', state: 'Andaman & Nicobar', lat: 11.8334, lng: 93.0505, category: Category.NATURE, description: 'A tiny pristine island with natural rock formations, clear lagoons, and some of the best coral reefs.', tags: ['beach', 'snorkeling', 'coral', 'island'], photoUrl: null },
  { name: 'Radhanagar Beach', city: 'Havelock Island', state: 'Andaman & Nicobar', lat: 11.9827, lng: 92.9404, category: Category.NATURE, description: "Rated Asia's best beach, with emerald waters, white sand, and lush forest backdrop.", tags: ['beach', 'swimming', 'sunset', 'award-winning'], photoUrl: null },
  { name: 'Baratang Island', city: 'Baratang', state: 'Andaman & Nicobar', lat: 12.2100, lng: 92.7568, category: Category.ADVENTURE, description: 'A unique island with limestone caves, mud volcanoes, and dense mangrove creeks.', tags: ['caves', 'mangroves', 'mud volcano', 'offbeat'], photoUrl: null },

  // Kerala
  { name: 'Munnar Tea Gardens', city: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595, category: Category.NATURE, description: 'Rolling hills carpeted with endless tea estates, with cool misty weather year-round.', tags: ['tea gardens', 'hills', 'scenic', 'nature'], photoUrl: null },
  { name: 'Alleppey Backwaters', city: 'Alappuzha', state: 'Kerala', lat: 9.4981, lng: 76.3388, category: Category.NATURE, description: 'The Venice of the East — a network of lagoons, lakes, and canals best explored on a houseboat.', tags: ['houseboat', 'backwaters', 'canals', 'sunset'], photoUrl: null },
  { name: 'Varkala Cliff', city: 'Varkala', state: 'Kerala', lat: 8.7379, lng: 76.7163, category: Category.OFFBEAT, description: 'A dramatic red laterite cliff overlooking the Arabian Sea, with cafes and a laid-back vibe.', tags: ['cliff', 'beach', 'sunset', 'cafes'], photoUrl: null },
  { name: 'Wayanad', city: 'Kalpetta', state: 'Kerala', lat: 11.6854, lng: 76.1320, category: Category.NATURE, description: 'Lush green hills, wildlife sanctuaries, tribal villages, and stunning waterfalls.', tags: ['wildlife', 'forests', 'waterfalls', 'trekking'], photoUrl: null },

  // Madhya Pradesh
  { name: 'Orchha', city: 'Orchha', state: 'Madhya Pradesh', lat: 25.3505, lng: 78.6418, category: Category.CULTURE, description: 'A medieval town on the banks of Betwa river, with magnificent palaces, temples, and cenotaphs.', tags: ['heritage', 'temples', 'palaces', 'river'], photoUrl: null },
  { name: 'Panna National Park', city: 'Panna', state: 'Madhya Pradesh', lat: 24.7253, lng: 80.1925, category: Category.ADVENTURE, description: 'A UNESCO Biosphere Reserve famous for tiger sightings, vultures, and the Ken River safari.', tags: ['wildlife', 'tigers', 'safari', 'nature'], photoUrl: null },

  // Sikkim
  { name: 'Gurudongmar Lake', city: 'North Sikkim', state: 'Sikkim', lat: 27.9880, lng: 88.7097, category: Category.NATURE, description: 'One of the highest lakes in the world at 17,800 ft, sacred to Buddhists and Sikhs alike.', tags: ['lake', 'high altitude', 'sacred', 'mountains'], photoUrl: null },
  { name: 'Yumthang Valley', city: 'Lachung', state: 'Sikkim', lat: 27.8333, lng: 88.6833, category: Category.NATURE, description: "The 'Valley of Flowers' of Sikkim, carpeted with rhododendrons in spring, near the China border.", tags: ['flowers', 'valley', 'mountains', 'rhododendron'], photoUrl: null },

  // Lakshadweep
  { name: 'Agatti Island', city: 'Agatti', state: 'Lakshadweep', lat: 10.8569, lng: 72.1942, category: Category.NATURE, description: 'A pristine coral atoll with turquoise lagoons and spectacular diving and snorkeling spots.', tags: ['coral', 'lagoon', 'diving', 'island'], photoUrl: null },
]

async function main() {
  console.log('Seeding discover places...')

  for (const place of discoverPlaces) {
    await prisma.discoverPlace.upsert({
      where: { id: place.name.toLowerCase().replace(/\s+/g, '-') },
      update: { photoUrl: place.photoUrl ?? null },
      create: {
        id: place.name.toLowerCase().replace(/\s+/g, '-'),
        ...place,
      },
    })
  }

  console.log(`Seeded ${discoverPlaces.length} discover places.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
