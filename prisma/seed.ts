import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const SPANISH_VOCABULARY = [
  // Greetings
  { unitKey: 'greetings', spanish: 'hola', english: 'hello', sentenceEs: 'Hola, ¿cómo estás?', sentenceEn: 'Hello, how are you?' },
  { unitKey: 'greetings', spanish: 'buenos días', english: 'good morning', sentenceEs: 'Buenos días, profesora.', sentenceEn: 'Good morning, teacher.' },
  { unitKey: 'greetings', spanish: 'buenas noches', english: 'good night', sentenceEs: 'Buenas noches, mamá.', sentenceEn: 'Good night, mom.' },
  { unitKey: 'greetings', spanish: 'gracias', english: 'thank you', sentenceEs: 'Gracias por la ayuda.', sentenceEn: 'Thank you for the help.' },
  { unitKey: 'greetings', spanish: 'de nada', english: "you're welcome", sentenceEs: 'De nada, fue un placer.', sentenceEn: "You're welcome, it was a pleasure." },
  { unitKey: 'greetings', spanish: 'por favor', english: 'please', sentenceEs: 'Un café, por favor.', sentenceEn: 'A coffee, please.' },
  { unitKey: 'greetings', spanish: 'perdón', english: 'excuse me', sentenceEs: 'Perdón, ¿dónde está el baño?', sentenceEn: 'Excuse me, where is the bathroom?' },
  { unitKey: 'greetings', spanish: 'sí', english: 'yes', sentenceEs: 'Sí, me gusta mucho.', sentenceEn: 'Yes, I like it a lot.' },
  { unitKey: 'greetings', spanish: 'no', english: 'no', sentenceEs: 'No, gracias.', sentenceEn: 'No, thank you.' },
  { unitKey: 'greetings', spanish: 'adiós', english: 'goodbye', sentenceEs: 'Adiós, hasta mañana.', sentenceEn: 'Goodbye, see you tomorrow.' },

  // Basics 1
  { unitKey: 'basics_1', spanish: 'yo', english: 'I', sentenceEs: 'Yo soy estudiante.', sentenceEn: 'I am a student.' },
  { unitKey: 'basics_1', spanish: 'tú', english: 'you', sentenceEs: 'Tú eres mi amigo.', sentenceEn: 'You are my friend.' },
  { unitKey: 'basics_1', spanish: 'él', english: 'he', sentenceEs: 'Él es mi hermano.', sentenceEn: 'He is my brother.' },
  { unitKey: 'basics_1', spanish: 'ella', english: 'she', sentenceEs: 'Ella es doctora.', sentenceEn: 'She is a doctor.' },
  { unitKey: 'basics_1', spanish: 'nosotros', english: 'we', sentenceEs: 'Nosotros somos amigos.', sentenceEn: 'We are friends.' },
  { unitKey: 'basics_1', spanish: 'ellos', english: 'they', sentenceEs: 'Ellos son de México.', sentenceEn: 'They are from Mexico.' },
  { unitKey: 'basics_1', spanish: 'es', english: 'is', sentenceEs: 'Mi casa es grande.', sentenceEn: 'My house is big.' },
  { unitKey: 'basics_1', spanish: 'son', english: 'are', sentenceEs: 'Los libros son nuevos.', sentenceEn: 'The books are new.' },
  { unitKey: 'basics_1', spanish: 'tengo', english: 'I have', sentenceEs: 'Tengo dos libros.', sentenceEn: 'I have two books.' },
  { unitKey: 'basics_1', spanish: 'quiero', english: 'I want', sentenceEs: 'Quiero aprender español.', sentenceEn: 'I want to learn Spanish.' },

  // Numbers
  { unitKey: 'numbers', spanish: 'uno', english: 'one', sentenceEs: 'Solo tengo uno.', sentenceEn: 'I only have one.' },
  { unitKey: 'numbers', spanish: 'dos', english: 'two', sentenceEs: 'Quiero dos manzanas.', sentenceEn: 'I want two apples.' },
  { unitKey: 'numbers', spanish: 'tres', english: 'three', sentenceEs: 'Hay tres gatos en la casa.', sentenceEn: 'There are three cats in the house.' },
  { unitKey: 'numbers', spanish: 'cuatro', english: 'four', sentenceEs: 'Somos cuatro en mi familia.', sentenceEn: 'There are four of us in my family.' },
  { unitKey: 'numbers', spanish: 'cinco', english: 'five', sentenceEs: 'Son las cinco de la tarde.', sentenceEn: 'It is five in the afternoon.' },
  { unitKey: 'numbers', spanish: 'seis', english: 'six', sentenceEs: 'Mi hermana tiene seis años.', sentenceEn: 'My sister is six years old.' },
  { unitKey: 'numbers', spanish: 'siete', english: 'seven', sentenceEs: 'La semana tiene siete días.', sentenceEn: 'The week has seven days.' },
  { unitKey: 'numbers', spanish: 'ocho', english: 'eight', sentenceEs: 'Trabajo ocho horas al día.', sentenceEn: 'I work eight hours a day.' },
  { unitKey: 'numbers', spanish: 'nueve', english: 'nine', sentenceEs: 'Mi clase empieza a las nueve.', sentenceEn: 'My class starts at nine.' },
  { unitKey: 'numbers', spanish: 'diez', english: 'ten', sentenceEs: 'Tengo diez dedos.', sentenceEn: 'I have ten fingers.' },

  // Colors
  { unitKey: 'colors', spanish: 'rojo', english: 'red', sentenceEs: 'La manzana es roja.', sentenceEn: 'The apple is red.' },
  { unitKey: 'colors', spanish: 'azul', english: 'blue', sentenceEs: 'El cielo es azul.', sentenceEn: 'The sky is blue.' },
  { unitKey: 'colors', spanish: 'verde', english: 'green', sentenceEs: 'El árbol es verde.', sentenceEn: 'The tree is green.' },
  { unitKey: 'colors', spanish: 'amarillo', english: 'yellow', sentenceEs: 'El sol es amarillo.', sentenceEn: 'The sun is yellow.' },
  { unitKey: 'colors', spanish: 'negro', english: 'black', sentenceEs: 'El gato es negro.', sentenceEn: 'The cat is black.' },
  { unitKey: 'colors', spanish: 'blanco', english: 'white', sentenceEs: 'La leche es blanca.', sentenceEn: 'The milk is white.' },
  { unitKey: 'colors', spanish: 'naranja', english: 'orange', sentenceEs: 'Me gusta la camisa naranja.', sentenceEn: 'I like the orange shirt.' },
  { unitKey: 'colors', spanish: 'morado', english: 'purple', sentenceEs: 'Ella tiene un vestido morado.', sentenceEn: 'She has a purple dress.' },
  { unitKey: 'colors', spanish: 'rosado', english: 'pink', sentenceEs: 'La flor es rosada.', sentenceEn: 'The flower is pink.' },
  { unitKey: 'colors', spanish: 'gris', english: 'gray', sentenceEs: 'El elefante es gris.', sentenceEn: 'The elephant is gray.' },

  // Food & Drink
  { unitKey: 'food_drink', spanish: 'agua', english: 'water', sentenceEs: 'Quiero un vaso de agua.', sentenceEn: 'I want a glass of water.' },
  { unitKey: 'food_drink', spanish: 'leche', english: 'milk', sentenceEs: 'Bebo leche en el desayuno.', sentenceEn: 'I drink milk at breakfast.' },
  { unitKey: 'food_drink', spanish: 'pan', english: 'bread', sentenceEs: 'Compro pan cada día.', sentenceEn: 'I buy bread every day.' },
  { unitKey: 'food_drink', spanish: 'arroz', english: 'rice', sentenceEs: 'Me gusta el arroz con pollo.', sentenceEn: 'I like rice with chicken.' },
  { unitKey: 'food_drink', spanish: 'pollo', english: 'chicken', sentenceEs: 'El pollo está delicioso.', sentenceEn: 'The chicken is delicious.' },
  { unitKey: 'food_drink', spanish: 'manzana', english: 'apple', sentenceEs: 'Como una manzana.', sentenceEn: 'I eat an apple.' },
  { unitKey: 'food_drink', spanish: 'café', english: 'coffee', sentenceEs: 'Mi padre bebe café por la mañana.', sentenceEn: 'My father drinks coffee in the morning.' },
  { unitKey: 'food_drink', spanish: 'jugo', english: 'juice', sentenceEs: 'Quiero jugo de naranja.', sentenceEn: 'I want orange juice.' },
  { unitKey: 'food_drink', spanish: 'queso', english: 'cheese', sentenceEs: 'El queso está en la mesa.', sentenceEn: 'The cheese is on the table.' },
  { unitKey: 'food_drink', spanish: 'huevo', english: 'egg', sentenceEs: 'Como un huevo en el desayuno.', sentenceEn: 'I eat an egg for breakfast.' },

  // Travel
  { unitKey: 'travel', spanish: 'aeropuerto', english: 'airport', sentenceEs: 'El aeropuerto es muy grande.', sentenceEn: 'The airport is very big.' },
  { unitKey: 'travel', spanish: 'hotel', english: 'hotel', sentenceEs: 'El hotel está cerca de la playa.', sentenceEn: 'The hotel is near the beach.' },
  { unitKey: 'travel', spanish: 'boleto', english: 'ticket', sentenceEs: 'Necesito un boleto de tren.', sentenceEn: 'I need a train ticket.' },
  { unitKey: 'travel', spanish: 'maleta', english: 'suitcase', sentenceEs: 'Mi maleta es azul.', sentenceEn: 'My suitcase is blue.' },
  { unitKey: 'travel', spanish: 'pasaporte', english: 'passport', sentenceEs: 'No encuentro mi pasaporte.', sentenceEn: "I can't find my passport." },
  { unitKey: 'travel', spanish: 'mapa', english: 'map', sentenceEs: 'Necesito un mapa de la ciudad.', sentenceEn: 'I need a map of the city.' },
  { unitKey: 'travel', spanish: 'avión', english: 'airplane', sentenceEs: 'El avión sale a las ocho.', sentenceEn: 'The airplane leaves at eight.' },
  { unitKey: 'travel', spanish: 'tren', english: 'train', sentenceEs: 'El tren llega a las cinco.', sentenceEn: 'The train arrives at five.' },
  { unitKey: 'travel', spanish: 'autobús', english: 'bus', sentenceEs: 'Tomo el autobús a la escuela.', sentenceEn: 'I take the bus to school.' },
  { unitKey: 'travel', spanish: 'taxi', english: 'taxi', sentenceEs: 'Quiero un taxi, por favor.', sentenceEn: 'I want a taxi, please.' },

  // Family
  { unitKey: 'family', spanish: 'madre', english: 'mother', sentenceEs: 'Mi madre cocina muy bien.', sentenceEn: 'My mother cooks very well.' },
  { unitKey: 'family', spanish: 'padre', english: 'father', sentenceEs: 'Mi padre trabaja en un hotel.', sentenceEn: 'My father works at a hotel.' },
  { unitKey: 'family', spanish: 'hermano', english: 'brother', sentenceEs: 'Mi hermano tiene diez años.', sentenceEn: 'My brother is ten years old.' },
  { unitKey: 'family', spanish: 'hermana', english: 'sister', sentenceEs: 'Mi hermana es muy simpática.', sentenceEn: 'My sister is very nice.' },
  { unitKey: 'family', spanish: 'abuelo', english: 'grandfather', sentenceEs: 'Mi abuelo vive en México.', sentenceEn: 'My grandfather lives in Mexico.' },
  { unitKey: 'family', spanish: 'abuela', english: 'grandmother', sentenceEs: 'Mi abuela hace pan.', sentenceEn: 'My grandmother makes bread.' },
  { unitKey: 'family', spanish: 'hijo', english: 'son', sentenceEs: 'Su hijo juega al fútbol.', sentenceEn: 'Her son plays soccer.' },
  { unitKey: 'family', spanish: 'hija', english: 'daughter', sentenceEs: 'Mi hija tiene seis años.', sentenceEn: 'My daughter is six years old.' },
  { unitKey: 'family', spanish: 'tío', english: 'uncle', sentenceEs: 'Mi tío tiene un perro.', sentenceEn: 'My uncle has a dog.' },
  { unitKey: 'family', spanish: 'tía', english: 'aunt', sentenceEs: 'Mi tía vive en Madrid.', sentenceEn: 'My aunt lives in Madrid.' },

  // Animals
  { unitKey: 'animals', spanish: 'perro', english: 'dog', sentenceEs: 'El perro es grande.', sentenceEn: 'The dog is big.' },
  { unitKey: 'animals', spanish: 'gato', english: 'cat', sentenceEs: 'El gato duerme en el sofá.', sentenceEn: 'The cat sleeps on the sofa.' },
  { unitKey: 'animals', spanish: 'pájaro', english: 'bird', sentenceEs: 'El pájaro canta por la mañana.', sentenceEn: 'The bird sings in the morning.' },
  { unitKey: 'animals', spanish: 'pez', english: 'fish', sentenceEs: 'El pez nada en el agua.', sentenceEn: 'The fish swims in the water.' },
  { unitKey: 'animals', spanish: 'caballo', english: 'horse', sentenceEs: 'El caballo es muy rápido.', sentenceEn: 'The horse is very fast.' },
  { unitKey: 'animals', spanish: 'vaca', english: 'cow', sentenceEs: 'La vaca da leche.', sentenceEn: 'The cow gives milk.' },
  { unitKey: 'animals', spanish: 'cerdo', english: 'pig', sentenceEs: 'El cerdo es rosado.', sentenceEn: 'The pig is pink.' },
  { unitKey: 'animals', spanish: 'conejo', english: 'rabbit', sentenceEs: 'El conejo come zanahorias.', sentenceEn: 'The rabbit eats carrots.' },
  { unitKey: 'animals', spanish: 'oso', english: 'bear', sentenceEs: 'El oso es fuerte.', sentenceEn: 'The bear is strong.' },
  { unitKey: 'animals', spanish: 'león', english: 'lion', sentenceEs: 'El león es el rey de la selva.', sentenceEn: 'The lion is the king of the jungle.' },
];

export const UNITS = [
  { key: 'greetings', title: 'Greetings', description: 'Say hello, goodbye, and express courtesies', orderIndex: 0, xpReward: 20 },
  { key: 'basics_1', title: 'Basics 1', description: 'Essential pronouns and everyday verbs', orderIndex: 1, xpReward: 20 },
  { key: 'numbers', title: 'Numbers', description: 'Count 1 to 10 with confidence', orderIndex: 2, xpReward: 20 },
  { key: 'colors', title: 'Colors', description: 'Describe colorful sights and objects', orderIndex: 3, xpReward: 20 },
  { key: 'food_drink', title: 'Food & Drink', description: 'Order coffee, milk, bread, and tasty meals', orderIndex: 4, xpReward: 20 },
  { key: 'travel', title: 'Travel', description: 'Navigate trains, planes, hotels, and passports', orderIndex: 5, xpReward: 20 },
  { key: 'family', title: 'Family', description: 'Talk about your parents, siblings, and relatives', orderIndex: 6, xpReward: 20 },
  { key: 'animals', title: 'Animals', description: 'Identify dogs, cats, birds, and forest creatures', orderIndex: 7, xpReward: 20 },
];

export const SEEDED_LEADERBOARD_USERS = [
  { name: 'Elena Rostova', xp: 4850, drift: 8.5 },
  { name: 'Mateo Morales', xp: 4420, drift: 7.2 },
  { name: 'Sophie Martin', xp: 3950, drift: 6.8 },
  { name: 'Lucas Silva', xp: 3600, drift: 9.1 },
  { name: 'Amara Chen', xp: 3200, drift: 8.0 },
  { name: 'Noah Becker', xp: 2890, drift: 5.5 },
  { name: 'Liam O’Connor', xp: 2540, drift: 6.0 },
  { name: 'Isabella Rossi', xp: 2210, drift: 7.4 },
  { name: 'Kenji Sato', xp: 1980, drift: 6.2 },
  { name: 'Chloe Dubois', xp: 1750, drift: 5.8 },
  { name: 'Julian Vance', xp: 1420, drift: 4.5 },
  { name: 'Fatima Al-Mansoor', xp: 1250, drift: 5.0 },
  { name: 'Oliver Twist', xp: 1100, drift: 4.2 },
  { name: 'Mia Andersson', xp: 950, drift: 4.0 },
  { name: 'Aarav Patel', xp: 820, drift: 3.8 },
  { name: 'Emma Watson', xp: 710, drift: 3.5 },
  { name: 'Diego Torres', xp: 620, drift: 4.5 },
  { name: 'Hannah Schmidt', xp: 530, drift: 3.2 },
  { name: 'Carlos Mendez', xp: 480, drift: 2.8 },
  { name: 'Yuki Tanaka', xp: 390, drift: 3.0 },
  { name: 'Zara Larsson', xp: 310, drift: 2.5 },
  { name: 'Felix Meyer', xp: 240, drift: 2.2 },
  { name: 'Ananya Sharma', xp: 180, drift: 2.0 },
  { name: 'Gabriel Costa', xp: 110, drift: 1.5 },
  { name: 'Sara Lind', xp: 60, drift: 1.0 },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Units
  const unitMap = new Map<string, string>();
  for (const u of UNITS) {
    const unit = await prisma.unit.upsert({
      where: { language_key: { language: 'es', key: u.key } },
      update: {
        title: u.title,
        description: u.description,
        orderIndex: u.orderIndex,
        xpReward: u.xpReward,
      },
      create: {
        language: 'es',
        key: u.key,
        title: u.title,
        description: u.description,
        orderIndex: u.orderIndex,
        xpReward: u.xpReward,
        exerciseCount: 12,
      },
    });
    unitMap.set(u.key, unit.id);
  }
  console.log(`✅ Upserted ${UNITS.length} units.`);

  // 2. Clear & Seed Vocabulary
  await prisma.vocabulary.deleteMany({ where: { language: 'es' } });
  let vocabCount = 0;
  for (let i = 0; i < SPANISH_VOCABULARY.length; i++) {
    const item = SPANISH_VOCABULARY[i];
    const unitId = unitMap.get(item.unitKey);
    if (!unitId) continue;

    await prisma.vocabulary.create({
      data: {
        language: 'es',
        unitId,
        spanish: item.spanish,
        english: item.english,
        sentenceEs: item.sentenceEs,
        sentenceEn: item.sentenceEn,
        position: i % 10,
      },
    });
    vocabCount++;
  }
  console.log(`✅ Seeded ${vocabCount} vocabulary items.`);

  // 3. Seed Leaderboard Users
  const dummyPasswordHash = await bcrypt.hash('SeedUserPass123!', 6);
  for (let i = 0; i < SEEDED_LEADERBOARD_USERS.length; i++) {
    const seed = SEEDED_LEADERBOARD_USERS[i];
    const email = `seed_${i + 1}@linguaquest.test`;
    await prisma.user.upsert({
      where: { email },
      update: {
        displayName: seed.name,
        totalXp: seed.xp,
        driftPerDay: seed.drift,
        isSeed: true,
      },
      create: {
        email,
        passwordHash: dummyPasswordHash,
        displayName: seed.name,
        timeZone: 'UTC',
        language: 'es',
        levelPref: 'beginner',
        totalXp: seed.xp,
        isSeed: true,
        driftPerDay: seed.drift,
      },
    });
  }
  console.log(`✅ Upserted ${SEEDED_LEADERBOARD_USERS.length} seeded leaderboard users.`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
