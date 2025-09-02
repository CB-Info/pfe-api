import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Dish,
  DishCategory,
  DishIngredientUnity,
} from '../mongo/models/dish.model';
import { Ingredient } from '../mongo/models/ingredient.model';
import { Card } from '../mongo/models/card.model';
import { Stock } from '../mongo/models/stock.model';
import { Order, OrderStatus } from '../mongo/models/order.model';
import { RestaurantTable } from '../mongo/models/restaurant.table.model';
import DateBeautifier from '../utils/date.beautifier';

@Injectable()
export class FixturesService {
  constructor(
    @InjectModel(Dish.name) private dishModel: Model<Dish>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
    @InjectModel(Card.name) private cardModel: Model<Card>,
    @InjectModel(Stock.name) private stockModel: Model<Stock>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(RestaurantTable.name)
    private tableModel: Model<RestaurantTable>,
  ) {}

  async insertFixtures(): Promise<void> {
    console.log('🚀 Démarrage du chargement des fixtures réalistes...');

    // Nettoyer toutes les données existantes
    await this.clearAllData();

    // Insérer les données dans l'ordre des dépendances
    const ingredientIdMap = await this.insertRealisticIngredients();
    const dishIdMap = await this.insertRealisticDishes(ingredientIdMap);
    await this.insertRealisticStock(ingredientIdMap);
    await this.insertRealisticCards(dishIdMap);
    await this.insertRealisticTables();
    await this.insertRealisticOrders(dishIdMap);

    console.log('✅ Fixtures réalistes chargées avec succès !');
  }

  private async clearAllData(): Promise<void> {
    console.log('🧹 Nettoyage des données existantes...');
    await Promise.all([
      this.ingredientModel.deleteMany({}),
      this.dishModel.deleteMany({}),
      this.cardModel.deleteMany({}),
      this.stockModel.deleteMany({}),
      this.orderModel.deleteMany({}),
      this.tableModel.deleteMany({}),
    ]);
  }

  private async insertRealisticIngredients(): Promise<Map<string, string>> {
    console.log('🥬 Insertion des ingrédients réalistes...');

    const realisticIngredients = [
      // Légumes
      'Tomate',
      'Carotte',
      'Oignon',
      'Ail',
      'Pomme de terre',
      'Courgette',
      'Aubergine',
      'Poivron rouge',
      'Poivron vert',
      'Champignon de Paris',
      'Épinard',
      'Salade verte',
      'Concombre',
      'Radis',
      'Brocoli',

      // Viandes et poissons
      'Bœuf (steak)',
      'Porc (côtelette)',
      'Agneau',
      'Poulet (blanc)',
      'Saumon',
      'Thon',
      'Crevettes',
      'Moules',
      'Jambon de Parme',

      // Produits laitiers et œufs
      'Lait',
      'Crème fraîche',
      'Beurre',
      'Parmesan',
      'Mozzarella',
      'Chèvre frais',
      'Œufs',
      'Yaourt grec',

      // Féculents et céréales
      'Pâtes (spaghetti)',
      'Pâtes (penne)',
      'Riz basmati',
      'Quinoa',
      'Pain de campagne',
      'Farine de blé',

      // Épices et aromates
      'Basilic frais',
      'Persil',
      'Ciboulette',
      'Thym',
      'Romarin',
      'Paprika',
      'Cumin',
      'Curry',
      'Poivre noir',
      'Sel de mer',

      // Autres
      "Huile d'olive",
      'Vinaigre balsamique',
      'Citron',
      'Miel',
      'Chocolat noir',
      'Vanille',
      'Café',
      'Sucre',
      "Farine d'amande",
    ];

    const ingredientFixtures = realisticIngredients.map((name) => ({
      name,
      dateOfCreation: DateBeautifier.shared.getFullDate(),
    }));

    const ingredients =
      await this.ingredientModel.insertMany(ingredientFixtures);

    // Créer une map nom -> ID pour faciliter les références
    const ingredientIdMap = new Map<string, string>();
    ingredients.forEach((ingredient) => {
      ingredientIdMap.set(ingredient.name, ingredient._id.toString());
    });

    console.log(`✅ ${ingredients.length} ingrédients insérés`);
    return ingredientIdMap;
  }

  private async insertRealisticDishes(
    ingredientIdMap: Map<string, string>,
  ): Promise<Map<string, string>> {
    console.log('🍽️ Insertion des plats réalistes...');

    const realisticDishes = [
      // Entrées
      {
        name: 'Salade de Chèvre Chaud',
        category: DishCategory.STARTERS,
        price: 12.5,
        description:
          'Salade verte aux tomates cerises, chèvre frais grillé et vinaigrette au miel',
        timeCook: 10,
        ingredients: [
          {
            name: 'Salade verte',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Tomate',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Chèvre frais',
            quantity: 60,
            unity: DishIngredientUnity.MILLILITRE,
          },
          { name: 'Miel', quantity: 15, unity: DishIngredientUnity.MILLILITRE },
          {
            name: "Huile d'olive",
            quantity: 20,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },
      {
        name: 'Velouté de Champignons',
        category: DishCategory.SOUPS,
        price: 9.0,
        description:
          'Velouté onctueux aux champignons de Paris, crème fraîche et fines herbes',
        timeCook: 25,
        ingredients: [
          {
            name: 'Champignon de Paris',
            quantity: 200,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Crème fraîche',
            quantity: 50,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Oignon',
            quantity: 50,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Beurre',
            quantity: 20,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },

      // Plats principaux
      {
        name: 'Saumon Grillé aux Légumes',
        category: DishCategory.FISH_SEAFOOD,
        price: 22.0,
        description:
          'Pavé de saumon grillé accompagné de légumes de saison et riz basmati',
        timeCook: 20,
        ingredients: [
          {
            name: 'Saumon',
            quantity: 150,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Riz basmati',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Courgette',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Carotte',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: "Huile d'olive",
            quantity: 15,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },
      {
        name: 'Steak de Bœuf aux Champignons',
        category: DishCategory.MAIN_DISHES,
        price: 25.0,
        description:
          'Entrecôte de bœuf grillée, sauce aux champignons et pommes de terre sautées',
        timeCook: 25,
        ingredients: [
          {
            name: 'Bœuf (steak)',
            quantity: 200,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Champignon de Paris',
            quantity: 120,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Pomme de terre',
            quantity: 150,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Crème fraîche',
            quantity: 40,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Beurre',
            quantity: 25,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },
      {
        name: 'Risotto aux Crevettes',
        category: DishCategory.PASTA_RICE,
        price: 19.5,
        description: 'Risotto crémeux aux crevettes, parmesan et basilic frais',
        timeCook: 30,
        ingredients: [
          {
            name: 'Riz basmati',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Crevettes',
            quantity: 120,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Parmesan',
            quantity: 50,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Basilic frais',
            quantity: 10,
            unity: DishIngredientUnity.MILLILITRE,
          },
          { name: 'Ail', quantity: 10, unity: DishIngredientUnity.MILLILITRE },
        ],
      },

      // Plats végétariens
      {
        name: 'Ratatouille Provençale',
        category: DishCategory.VEGETARIAN,
        price: 14.0,
        description:
          'Mélange de légumes du soleil mijotés aux herbes de Provence',
        timeCook: 35,
        ingredients: [
          {
            name: 'Aubergine',
            quantity: 120,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Courgette',
            quantity: 120,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Tomate',
            quantity: 150,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Poivron rouge',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Oignon',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          { name: 'Ail', quantity: 15, unity: DishIngredientUnity.MILLILITRE },
          { name: 'Thym', quantity: 5, unity: DishIngredientUnity.MILLILITRE },
        ],
      },

      // Desserts
      {
        name: 'Tiramisu Maison',
        category: DishCategory.DESSERTS,
        price: 8.5,
        description:
          'Dessert italien traditionnel au café, mascarpone et cacao',
        timeCook: 15,
        ingredients: [
          {
            name: 'Café',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
          { name: 'Œufs', quantity: 3, unity: DishIngredientUnity.MILLILITRE },
          {
            name: 'Sucre',
            quantity: 60,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Chocolat noir',
            quantity: 30,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },
      {
        name: 'Tarte au Citron',
        category: DishCategory.DESSERTS,
        price: 7.5,
        description: 'Tarte au citron meringuée, pâte sablée maison',
        timeCook: 45,
        ingredients: [
          {
            name: 'Citron',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          { name: 'Œufs', quantity: 2, unity: DishIngredientUnity.MILLILITRE },
          {
            name: 'Sucre',
            quantity: 80,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Beurre',
            quantity: 40,
            unity: DishIngredientUnity.MILLILITRE,
          },
          {
            name: 'Farine de blé',
            quantity: 100,
            unity: DishIngredientUnity.MILLILITRE,
          },
        ],
      },
    ];

    const dishFixtures = realisticDishes.map((dish) => ({
      name: dish.name,
      ingredients: dish.ingredients
        .map((ingredient) => ({
          ingredientId: ingredientIdMap.get(ingredient.name),
          unity: ingredient.unity,
          quantity: ingredient.quantity,
        }))
        .filter((ingredient) => ingredient.ingredientId), // Filtrer les ingrédients non trouvés
      price: dish.price,
      description: dish.description,
      category: dish.category,
      timeCook: dish.timeCook,
      isAvailable: true,
      dateOfCreation: DateBeautifier.shared.getFullDate(),
    }));

    const dishes = await this.dishModel.insertMany(dishFixtures);

    // Créer une map nom -> ID pour faciliter les références
    const dishIdMap = new Map<string, string>();
    dishes.forEach((dish) => {
      dishIdMap.set(dish.name, dish._id.toString());
    });

    console.log(`✅ ${dishes.length} plats insérés`);
    return dishIdMap;
  }

  private async insertRealisticStock(
    ingredientIdMap: Map<string, string>,
  ): Promise<void> {
    console.log('📦 Insertion du stock principal...');

    const stockIngredients = Array.from(ingredientIdMap.entries()).map(
      ([, id]) => ({
        ingredientId: id,
        currentQuantity: Math.floor(Math.random() * 100) + 20, // Entre 20 et 120
        minimalQuantity: Math.floor(Math.random() * 15) + 5, // Entre 5 et 20
        dateAddedToStock: DateBeautifier.shared.getFullDate(),
      }),
    );

    const stockFixture = {
      name: 'Stock Principal Restaurant',
      ingredients: stockIngredients,
      dateOfCreation: DateBeautifier.shared.getFullDate(),
    };

    await this.stockModel.create(stockFixture);
    console.log(
      `✅ Stock principal créé avec ${stockIngredients.length} ingrédients`,
    );
  }

  private async insertRealisticCards(
    dishIdMap: Map<string, string>,
  ): Promise<void> {
    console.log('📋 Insertion des cartes/menus...');

    const allDishIds = Array.from(dishIdMap.values());

    const cardFixtures = [
      {
        name: 'Menu Découverte',
        dishesId: allDishIds.slice(0, 6), // 6 premiers plats
        isActive: true,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
      {
        name: 'Menu Végétarien',
        dishesId: [
          dishIdMap.get('Ratatouille Provençale'),
          dishIdMap.get('Velouté de Champignons'),
          dishIdMap.get('Tiramisu Maison'),
          dishIdMap.get('Tarte au Citron'),
        ].filter(Boolean),
        isActive: true,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
      {
        name: 'Menu Mer et Terre',
        dishesId: [
          dishIdMap.get('Saumon Grillé aux Légumes'),
          dishIdMap.get('Steak de Bœuf aux Champignons'),
          dishIdMap.get('Salade de Chèvre Chaud'),
        ].filter(Boolean),
        isActive: true,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
      {
        name: 'Menu Traditionnel',
        dishesId: [
          dishIdMap.get('Risotto aux Crevettes'),
          dishIdMap.get('Steak de Bœuf aux Champignons'),
          dishIdMap.get('Tiramisu Maison'),
          dishIdMap.get('Tarte au Citron'),
        ].filter(Boolean),
        isActive: false, // Menu saisonnier pas encore actif
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
    ];

    await this.cardModel.insertMany(cardFixtures);
    console.log(`✅ ${cardFixtures.length} cartes/menus insérés`);
  }

  private async insertRealisticTables(): Promise<void> {
    console.log('🪑 Insertion des tables...');

    const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25];

    const tableFixtures = tableNumbers.map((number) => ({
      number,
    }));

    await this.tableModel.insertMany(tableFixtures);
    console.log(`✅ ${tableFixtures.length} tables insérées`);
  }

  private async insertRealisticOrders(
    dishIdMap: Map<string, string>,
  ): Promise<void> {
    console.log("🛒 Insertion des commandes d'exemple...");

    // Récupérer quelques tables
    const tables = await this.tableModel.find().limit(5);
    if (tables.length === 0) {
      console.log('⚠️ Aucune table trouvée, commandes non créées');
      return;
    }

    const allDishIds = Array.from(dishIdMap.values());

    const orderFixtures = [
      {
        tableNumberId: tables[1]?._id || tables[0]._id,
        dishes: [
          { dishId: allDishIds[0], isPaid: false },
          { dishId: allDishIds[1], isPaid: true },
        ],
        status: OrderStatus.IN_PREPARATION,
        totalPrice: 21.5,
        tips: 3.5,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
      {
        tableNumberId: tables[2]?._id || tables[0]._id,
        dishes: [
          { dishId: allDishIds[2], isPaid: false },
          { dishId: allDishIds[3], isPaid: false },
        ],
        status: OrderStatus.READY,
        totalPrice: 47.0,
        tips: 5.0,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
      {
        tableNumberId: tables[4]?._id || tables[0]._id,
        dishes: [{ dishId: allDishIds[0], isPaid: true }],
        status: OrderStatus.DELIVERED,
        totalPrice: 12.5,
        tips: 2.0,
        dateOfCreation: DateBeautifier.shared.getFullDate(),
      },
    ];

    await this.orderModel.insertMany(orderFixtures);
    console.log(`✅ ${orderFixtures.length} commandes insérées`);
  }
}
