import { prisma } from '../src/prisma/client';
import { ProductService } from '../src/services/product.service';

const productService = new ProductService();

// Herbs products data
const herbsProducts = [
    { name: 'Aelwa', unit: 'Kgs', category: 'Herbs', purchaseRate: 2400, sellingPrice: 8000 },
    { name: 'Akarkara', unit: 'Kgs', category: 'Herbs', purchaseRate: 3200, sellingPrice: 38000 },
    { name: 'Akash Bail', unit: 'Kgs', category: 'Herbs', purchaseRate: 2500, sellingPrice: 8000 },
    { name: 'Amaltas Phalli (Gurmara)', unit: 'Kgs', category: 'Herbs', purchaseRate: 90, sellingPrice: 600 },
    { name: 'Amba Turmeric (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 850, sellingPrice: 3200 },
    { name: 'Amba Turmeric (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 430, sellingPrice: 2400 },
    { name: 'Amla (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1000 },
    { name: 'Amla Gandak', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 3600 },
    { name: 'Amla powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 1500 },
    { name: 'Amla Ka Chilkha', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1200 },
    { name: 'Anaar ka Chilka', unit: 'Kgs', category: 'Herbs', purchaseRate: 60, sellingPrice: 1600 },
    { name: 'Anar ke Phool', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 10000 },
    { name: 'Arjun ki Chaal', unit: 'Kgs', category: 'Herbs', purchaseRate: 120, sellingPrice: 2400 },
    { name: 'Asad Patta', unit: 'Kgs', category: 'Herbs', purchaseRate: 350, sellingPrice: 1600 },
    { name: 'Asgand Nagori (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1400, sellingPrice: 5600 },
    { name: 'Asgand Nagori Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 1500, sellingPrice: 6000 },
    { name: 'Askhar Makki', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 8000 },
    { name: 'Ast e Quddus (Dried Lavender)', unit: 'Kgs', category: 'Herbs', purchaseRate: 350, sellingPrice: 2800 },
    { name: 'Ount Kattara', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 2400 },
    { name: 'Baalchar', unit: 'Kgs', category: 'Herbs', purchaseRate: 1800, sellingPrice: 8000 },
    { name: 'Baapchi', unit: 'Kgs', category: 'Herbs', purchaseRate: 1300, sellingPrice: 7200 },
    { name: 'Badam ki Chal', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 3200 },
    { name: 'Bahi Whole', unit: 'Kgs', category: 'Herbs', purchaseRate: 1200, sellingPrice: 4800 },
    { name: 'Banafsha Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 240, sellingPrice: 8000 },
    { name: 'Bhringraj (Bhangra Sia)', unit: 'Kgs', category: 'Herbs', purchaseRate: 120, sellingPrice: 1800 },
    { name: 'Barahimi booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 650, sellingPrice: 8000 },
    { name: 'Bareman Safaid', unit: 'Kgs', category: 'Herbs', purchaseRate: 150, sellingPrice: 1600 },
    { name: 'Bareman Surkh', unit: 'Kgs', category: 'Herbs', purchaseRate: 150, sellingPrice: 1600 },
    { name: 'Barg e Sanobar', unit: 'Pcs', category: 'Herbs', purchaseRate: 1600, sellingPrice: 8000 },
    { name: 'Bargh e Sadab (Garden Rue)', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 2800 },
    { name: 'Barghe Gaozaban', unit: 'Kgs', category: 'Herbs', purchaseRate: 720, sellingPrice: 8000 },
    { name: 'Bari Harr Ka Chilka', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1400 },
    { name: 'Bari Harr (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 320, sellingPrice: 2400 },
    { name: 'Bari Harr Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 420, sellingPrice: 2600 },
    { name: 'Barry Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 160, sellingPrice: 1200 },
    { name: 'Berah Chilka', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1400 },
    { name: 'Bahera (Beleric Myrobalan - Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 220, sellingPrice: 2400 },
    { name: 'Bahera (Beleric Myrobalan - Powder)', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 2800 },
    { name: 'Bahi Dana', unit: 'Kgs', category: 'Herbs', purchaseRate: 4200, sellingPrice: 28000 },
    { name: 'Bichu Booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 900, sellingPrice: 3600 },
    { name: 'Biscuit Katha', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 1600 },
    { name: 'Bitter Gourd - Jaman Powder', unit: 'Pcs', category: 'Herbs', purchaseRate: 0, sellingPrice: 350 },
    { name: 'Bitter Melon Plum Powder (Karaila jaman)', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 3500 },
    { name: 'Camphor', unit: 'Pcs', category: 'Herbs', purchaseRate: 11.43, sellingPrice: 30 },
    { name: 'Carrot Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 1600 },
    { name: 'Chandan Booty (Choti Chandan)', unit: 'Kgs', category: 'Herbs', purchaseRate: 2600, sellingPrice: 4800 },
    { name: 'Charaita', unit: 'Kgs', category: 'Herbs', purchaseRate: 320, sellingPrice: 8000 },
    { name: 'Charonji', unit: 'Kgs', category: 'Herbs', purchaseRate: 7000, sellingPrice: 8800 },
    { name: 'Chasku', unit: 'Kgs', category: 'Herbs', purchaseRate: 3500, sellingPrice: 4800 },
    { name: 'Chatrak', unit: 'Kgs', category: 'Herbs', purchaseRate: 100, sellingPrice: 220 },
    { name: 'Chia Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 960, sellingPrice: 2400 },
    { name: 'Chia Seeds Imported', unit: 'Kgs', category: 'Herbs', purchaseRate: 1100, sellingPrice: 5800 },
    { name: 'Chikni Chahliya', unit: 'Kgs', category: 'Herbs', purchaseRate: 3500, sellingPrice: 5200 },
    { name: 'Chop Cheeni (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 3400, sellingPrice: 6400 },
    { name: 'Chop Cheeni (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 550, sellingPrice: 1800 },
    { name: 'Choti Harr (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 950, sellingPrice: 2600 },
    { name: 'Choti Harr Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 1050, sellingPrice: 2800 },
    { name: 'Chout Saddi', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 1200 },
    { name: 'Dhamasa Booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 100, sellingPrice: 8000 },
    { name: 'Dried Lemon', unit: 'Kgs', category: 'Herbs', purchaseRate: 680, sellingPrice: 1600 },
    { name: 'Dried Mint (Pahari)', unit: 'Kgs', category: 'Herbs', purchaseRate: 280, sellingPrice: 1800 },
    { name: 'Eyesight And Brain Powder ( Box )', unit: 'Pcs', category: 'Herbs', purchaseRate: 650, sellingPrice: 1500 },
    { name: 'Face Mask', unit: 'Pcs', category: 'Herbs', purchaseRate: 400, sellingPrice: 800 },
    { name: 'Falsay ki chaal', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 2400 },
    { name: 'Flax Seed (Alsi)', unit: 'Kgs', category: 'Herbs', purchaseRate: 360, sellingPrice: 1000 },
    { name: 'Flax seed Powder (Alsi powder)', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1400 },
    { name: 'Ganda Beroza', unit: 'Kgs', category: 'Herbs', purchaseRate: 650, sellingPrice: 2800 },
    { name: 'Gandak (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 150, sellingPrice: 600 },
    { name: 'Ganderi Katha', unit: 'Kgs', category: 'Herbs', purchaseRate: 2200, sellingPrice: 4800 },
    { name: 'Gandhari Waj', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 2400 },
    { name: 'Ghokru Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 5000 },
    { name: 'Ghokru Whole', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 4800 },
    { name: 'Gondh Kateera (Tragacanth Gum)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1200, sellingPrice: 3600 },
    { name: 'Googal', unit: 'Kgs', category: 'Herbs', purchaseRate: 2600, sellingPrice: 7200 },
    { name: 'Green Tea Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 2000 },
    { name: 'Gul e Babuna (Chamomile)', unit: 'Kgs', category: 'Herbs', purchaseRate: 900, sellingPrice: 2800 },
    { name: 'Gul e Banafsha (Sweet Violet)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1700, sellingPrice: 8000 },
    { name: 'Gul e Bukhoor', unit: 'Kgs', category: 'Herbs', purchaseRate: 350, sellingPrice: 2400 },
    { name: 'Gul E Gorail', unit: 'Kgs', category: 'Herbs', purchaseRate: 1800, sellingPrice: 10000 },
    { name: 'Gul e Supari', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 2400 },
    { name: 'Dried Rose Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1800 },
    { name: 'Dried Rose Petals', unit: 'Kgs', category: 'Herbs', purchaseRate: 150, sellingPrice: 1600 },
    { name: 'Gulmundi', unit: 'Kgs', category: 'Herbs', purchaseRate: 550, sellingPrice: 1600 },
    { name: 'Gurmaar Booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 1300, sellingPrice: 3600 },
    { name: 'Halun Dana', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 1600 },
    { name: 'Harmal (Kala Dana)', unit: 'Kgs', category: 'Herbs', purchaseRate: 240, sellingPrice: 800 },
    { name: 'Hartal', unit: 'Kgs', category: 'Herbs', purchaseRate: 18000, sellingPrice: 28000 },
    { name: 'Height Growth Powwder ( Box )', unit: 'Pcs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1200 },
    { name: 'Hibiscus Flowers', unit: 'Kgs', category: 'Herbs', purchaseRate: 2200, sellingPrice: 6000 },
    { name: 'Hibiscus Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 3500, sellingPrice: 7000 },
    { name: 'Hing (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 7000, sellingPrice: 20000 },
    { name: 'Hing (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 5200, sellingPrice: 20000 },
    { name: 'Husn e Yousuf', unit: 'Kgs', category: 'Herbs', purchaseRate: 1400, sellingPrice: 10000 },
    { name: 'Imli Ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 140, sellingPrice: 480 },
    { name: 'Indar Jaww (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 1800 },
    { name: 'Indar Jaww (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1200, sellingPrice: 2400 },
    { name: 'Indigo Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 2800, sellingPrice: 4500 },
    { name: 'Ispaghol (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 750, sellingPrice: 1800 },
    { name: 'Ispaghol Bhoosi', unit: 'Kgs', category: 'Herbs', purchaseRate: 3600, sellingPrice: 6200 },
    { name: 'Jaman powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 170, sellingPrice: 3500 },
    { name: 'Jaman Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 100, sellingPrice: 1600 },
    { name: 'Ginseng', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 9000 },
    { name: 'Joint Pain Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1400 },
    { name: 'Kabab Cheeni', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 2400 },
    { name: 'Kahu Ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 1300, sellingPrice: 2800 },
    { name: 'Kaisu Flowers', unit: 'Kgs', category: 'Herbs', purchaseRate: 280, sellingPrice: 1000 },
    { name: 'Kakachiya', unit: 'Kgs', category: 'Herbs', purchaseRate: 1000, sellingPrice: 4800 },
    { name: 'Kakar Singhi (Pistacia Integerrima)', unit: 'Kgs', category: 'Herbs', purchaseRate: 350, sellingPrice: 1600 },
    { name: 'Kali Moosli', unit: 'Kgs', category: 'Herbs', purchaseRate: 2400, sellingPrice: 12000 },
    { name: 'Kali Zeeri', unit: 'Kgs', category: 'Herbs', purchaseRate: 750, sellingPrice: 1600 },
    { name: 'Kalmi Shoura', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 1000 },
    { name: 'Kamarkas', unit: 'Kgs', category: 'Herbs', purchaseRate: 1600, sellingPrice: 2800 },
    { name: 'Kamila Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 2400 },
    { name: 'Kundar Goond', unit: 'Kgs', category: 'Herbs', purchaseRate: 1600, sellingPrice: 8000 },
    { name: 'Kapoor Kachri (Ginger Lily)', unit: 'Kgs', category: 'Herbs', purchaseRate: 2600, sellingPrice: 4200 },
    { name: 'Karu / Kutki (Picrorhiza Kurroa)', unit: 'Kgs', category: 'Herbs', purchaseRate: 750, sellingPrice: 3600 },
    { name: 'Kashkari', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 1200 },
    { name: 'Kasni ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 1600 },
    { name: 'Kast e Shirin (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 550, sellingPrice: 14000 },
    { name: 'Kast e Shirin (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 240, sellingPrice: 12000 },
    { name: 'Kast ul Bahri (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 1600 },
    { name: 'Kast ul Bahri (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1200 },
    { name: 'Kast ul Hindi (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 320, sellingPrice: 1600 },
    { name: 'Kast ul Hindi (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 1200 },
    { name: 'Katla Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 3200, sellingPrice: 6000 },
    { name: 'Khakseer', unit: 'Kgs', category: 'Herbs', purchaseRate: 850, sellingPrice: 1800 },
    { name: 'Kini Kate', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 3600 },
    { name: 'Koonj Ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 2400 },
    { name: 'Kor Tumba', unit: 'Kgs', category: 'Herbs', purchaseRate: 160, sellingPrice: 1800 },
    { name: 'Kor Tumba (Seeds)', unit: 'Kgs', category: 'Herbs', purchaseRate: 160, sellingPrice: 1600 },
    { name: 'Kulfay Ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 550, sellingPrice: 2400 },
    { name: 'Kulti ki Daal', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 960 },
    { name: 'Laak Dana', unit: 'Kgs', category: 'Herbs', purchaseRate: 4600, sellingPrice: 7200 },
    { name: 'Lajwanti', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 1600 },
    { name: 'Lasora Whole', unit: 'Kgs', category: 'Herbs', purchaseRate: 120, sellingPrice: 4800 },
    { name: 'Lauq e Sapistan (Dried Lasoorah)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1200, sellingPrice: 4800 },
    { name: 'Lemon Tea Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 2000 },
    { name: 'Luban', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 800 },
    { name: 'Magaz Banola', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 4800 },
    { name: 'Maida Lakri', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 3200 },
    { name: 'Majoun', unit: 'Pcs', category: 'Herbs', purchaseRate: 500, sellingPrice: 2200 },
    { name: 'Maju Phal', unit: 'Kgs', category: 'Herbs', purchaseRate: 2400, sellingPrice: 4800 },
    { name: 'Makoh Daana', unit: 'Kgs', category: 'Herbs', purchaseRate: 480, sellingPrice: 1600 },
    { name: 'Male Sexual Problem Powder ( box )', unit: 'Pcs', category: 'Herbs', purchaseRate: 800, sellingPrice: 2500 },
    { name: 'Marathi Mogo', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1600 },
    { name: 'Marmaki', unit: 'Kgs', category: 'Herbs', purchaseRate: 4000, sellingPrice: 5600 },
    { name: 'Mehandi', unit: 'Kgs', category: 'Herbs', purchaseRate: 230, sellingPrice: 600 },
    { name: 'Mehandi ke Patte', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 1000 },
    { name: 'Mint Capsule', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 1600 },
    { name: 'Mochras', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 540 },
    { name: 'Mooli Ke Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 1600 },
    { name: 'Moringa Capsule (60)', unit: 'Pcs', category: 'Herbs', purchaseRate: 320, sellingPrice: 1150 },
    { name: 'Moringa Powder Box 100 GM', unit: 'Pcs', category: 'Herbs', purchaseRate: 250, sellingPrice: 700 },
    { name: 'Moringa Powder Box 50 GM', unit: 'Pcs', category: 'Herbs', purchaseRate: 250, sellingPrice: 350 },
    { name: 'MP Arq e Gulab (Spray)', unit: 'Pcs', category: 'Herbs', purchaseRate: 11.07, sellingPrice: 150 },
    { name: 'Mulethi (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 1200 },
    { name: 'Mulethi Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1600 },
    { name: 'Multani Mitti', unit: 'Kgs', category: 'Herbs', purchaseRate: 30, sellingPrice: 250 },
    { name: 'Nagarmotha', unit: 'Kgs', category: 'Herbs', purchaseRate: 150, sellingPrice: 1600 },
    { name: 'Nakhuna', unit: 'Kgs', category: 'Herbs', purchaseRate: 800, sellingPrice: 2400 },
    { name: 'Narkachoor (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 560, sellingPrice: 3000 },
    { name: 'Narkachoor (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 2400 },
    { name: 'Nasboo Kay Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 440, sellingPrice: 1800 },
    { name: 'Nawab Katha', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 2000 },
    { name: 'Neebat', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 480 },
    { name: 'Neela Tota', unit: 'Kgs', category: 'Herbs', purchaseRate: 540, sellingPrice: 1600 },
    { name: 'Neem leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 140, sellingPrice: 1200 },
    { name: 'Neem Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 160, sellingPrice: 3200 },
    { name: 'Neem Seeds', unit: 'Kgs', category: 'Herbs', purchaseRate: 100, sellingPrice: 1600 },
    { name: 'Nilofar ( Herbs )', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 900 },
    { name: 'Nowshadar', unit: 'Kgs', category: 'Herbs', purchaseRate: 50, sellingPrice: 1000 },
    { name: 'Orange peel Mask', unit: 'Pcs', category: 'Herbs', purchaseRate: 250, sellingPrice: 600 },
    { name: 'Orange Peel Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 2000 },
    { name: 'Paan ki Char', unit: 'Kgs', category: 'Herbs', purchaseRate: 1000, sellingPrice: 2400 },
    { name: 'Pabri Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 1400, sellingPrice: 1500 },
    { name: 'Paneer booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 800 },
    { name: 'Panja Moosli', unit: 'Kgs', category: 'Herbs', purchaseRate: 30000, sellingPrice: 65000 },
    { name: 'panwar beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 1600 },
    { name: 'Parshosha', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 8000 },
    { name: 'Pathani Lout', unit: 'Kgs', category: 'Herbs', purchaseRate: 750, sellingPrice: 2400 },
    { name: 'Pathri Faulad', unit: 'Kgs', category: 'Herbs', purchaseRate: 560, sellingPrice: 2800 },
    { name: 'Patthar Ke Phool', unit: 'Kgs', category: 'Herbs', purchaseRate: 520, sellingPrice: 8000 },
    { name: 'Peppermint', unit: 'Kgs', category: 'Herbs', purchaseRate: 7000, sellingPrice: 30000 },
    { name: 'Phitkari', unit: 'Kgs', category: 'Herbs', purchaseRate: 120, sellingPrice: 600 },
    { name: 'Phitkari (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 200, sellingPrice: 800 },
    { name: 'Piplamor', unit: 'Kgs', category: 'Herbs', purchaseRate: 1300, sellingPrice: 4800 },
    { name: 'Qamarband', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 70 },
    { name: 'Raiwan cheeni', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 3600 },
    { name: 'Ratanjot', unit: 'Kgs', category: 'Herbs', purchaseRate: 1200, sellingPrice: 8000 },
    { name: 'Reetha (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 120, sellingPrice: 1000 },
    { name: 'Reetha Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 220, sellingPrice: 1500 },
    { name: 'Room e Mustagi', unit: 'Kgs', category: 'Herbs', purchaseRate: 48000, sellingPrice: 70000 },
    { name: 'Rosemary Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 1500, sellingPrice: 8000 },
    { name: "Za'atar", unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 2800 },
    { name: 'Safaid Moosli (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1300, sellingPrice: 30000 },
    { name: 'Safaid Moosli (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 12800, sellingPrice: 28000 },
    { name: 'Safaid Todri', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 1600 },
    { name: 'Salab Misri', unit: 'Kgs', category: 'Herbs', purchaseRate: 28000, sellingPrice: 65000 },
    { name: 'Salab Moosli', unit: 'Kgs', category: 'Herbs', purchaseRate: 30000, sellingPrice: 56000 },
    { name: 'Samandri Jhaag', unit: 'Kgs', category: 'Herbs', purchaseRate: 1400, sellingPrice: 3600 },
    { name: 'Senna Leaves', unit: 'Kgs', category: 'Herbs', purchaseRate: 300, sellingPrice: 2000 },
    { name: 'Senna Leaves (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 260, sellingPrice: 2200 },
    { name: 'Sandal Wood Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 180, sellingPrice: 2000 },
    { name: 'Sang e Jarat', unit: 'Kgs', category: 'Herbs', purchaseRate: 1600, sellingPrice: 7000 },
    { name: 'Sarson Ki Chaal', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 800 },
    { name: 'Satte e Gilo (Tinospora Cordifolia)', unit: 'Kgs', category: 'Herbs', purchaseRate: 140, sellingPrice: 2400 },
    { name: 'Sattawar', unit: 'Kgs', category: 'Herbs', purchaseRate: 3400, sellingPrice: 9600 },
    { name: 'Satte Ajwain', unit: 'Kgs', category: 'Herbs', purchaseRate: 5200, sellingPrice: 30000 },
    { name: 'Satte Kafoor', unit: 'Kgs', category: 'Herbs', purchaseRate: 4000, sellingPrice: 30000 },
    { name: 'Satte Podena', unit: 'Kgs', category: 'Herbs', purchaseRate: 6000, sellingPrice: 30000 },
    { name: 'Seepiyan', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 1600 },
    { name: 'Shahtoot (Mulberry)', unit: 'Kgs', category: 'Herbs', purchaseRate: 850, sellingPrice: 1800 },
    { name: 'Shilajit 0.5 gm', unit: 'Pcs', category: 'Herbs', purchaseRate: 120, sellingPrice: 1100 },
    { name: 'Sikakai (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 440, sellingPrice: 1000 },
    { name: 'Sikakai Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 500, sellingPrice: 1500 },
    { name: 'Sindhoor', unit: 'Kgs', category: 'Herbs', purchaseRate: 950, sellingPrice: 4000 },
    { name: 'Singhara (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 640, sellingPrice: 1400 },
    { name: 'Singhara Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 2000 },
    { name: 'Soapnut Powder', unit: 'Pcs', category: 'Herbs', purchaseRate: 0, sellingPrice: 240 },
    { name: 'Soya Dana', unit: 'Kgs', category: 'Herbs', purchaseRate: 480, sellingPrice: 1600 },
    { name: 'Suhaga', unit: 'Kgs', category: 'Herbs', purchaseRate: 560, sellingPrice: 8000 },
    { name: 'Suhanjna ki Gondh', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 7200 },
    { name: 'Sumblo Booty', unit: 'Kgs', category: 'Herbs', purchaseRate: 280, sellingPrice: 2400 },
    { name: 'Suranjan Powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 4000, sellingPrice: 5600 },
    { name: 'Suranjan Shirin (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 3600, sellingPrice: 5200 },
    { name: 'Surkh Todri', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 1600 },
    { name: 'Surma (Grounded)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1100, sellingPrice: 2000 },
    { name: 'Surma (Whole)', unit: 'Kgs', category: 'Herbs', purchaseRate: 1000, sellingPrice: 1600 },
    { name: 'Tabasheer', unit: 'Kgs', category: 'Herbs', purchaseRate: 6000, sellingPrice: 28000 },
    { name: 'Taramira Seeds (Arugula seeds)', unit: 'Kgs', category: 'Herbs', purchaseRate: 250, sellingPrice: 1200 },
    { name: 'Timber', unit: 'Kgs', category: 'Herbs', purchaseRate: 480, sellingPrice: 2400 },
    { name: 'Triflah', unit: 'Kgs', category: 'Herbs', purchaseRate: 600, sellingPrice: 2800 },
    { name: 'Tukhm e Ispat', unit: 'Kgs', category: 'Herbs', purchaseRate: 360, sellingPrice: 1200 },
    { name: 'Tukhm e Kurfas', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 1600 },
    { name: 'Tukhm e Saras', unit: 'Kgs', category: 'Herbs', purchaseRate: 140, sellingPrice: 2400 },
    { name: 'Tukhme Utangan', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 3600 },
    { name: 'Turbat Safaid', unit: 'Kgs', category: 'Herbs', purchaseRate: 700, sellingPrice: 2800 },
    { name: 'Ubtan', unit: 'Kgs', category: 'Herbs', purchaseRate: 960, sellingPrice: 2000 },
    { name: 'Unaab ( Jujube)', unit: 'Kgs', category: 'Herbs', purchaseRate: 400, sellingPrice: 800 },
    { name: 'Waqumba Beej', unit: 'Kgs', category: 'Herbs', purchaseRate: 450, sellingPrice: 4800 },
    { name: 'Waras', unit: 'Kgs', category: 'Herbs', purchaseRate: 5200, sellingPrice: 28000 },
    { name: 'Wawring', unit: 'Kgs', category: 'Herbs', purchaseRate: 1000, sellingPrice: 2400 },
    { name: 'Weight loss powder', unit: 'Kgs', category: 'Herbs', purchaseRate: 350, sellingPrice: 3500 },
    { name: 'Zarshak', unit: 'Kgs', category: 'Herbs', purchaseRate: 1150, sellingPrice: 2800 },
    { name: 'Zerisht', unit: 'Kgs', category: 'Herbs', purchaseRate: 1600, sellingPrice: 36000 },
];

async function updateHerbsPricing() {
    try {
        console.log(`📋 Processing ${herbsProducts.length} Herbs products\n`);

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < herbsProducts.length; i++) {
            const prod = herbsProducts[i];
            
            try {
                // Skip products with 0 selling price (they need manual pricing)
                if (prod.sellingPrice === 0) {
                    console.log(`\n[${i + 1}/${herbsProducts.length}] ⚠️  Skipping: ${prod.name} (Selling Price is 0)`);
                    skippedCount++;
                    results.push({ 
                        success: false, 
                        skipped: true,
                        reason: 'Selling price is 0',
                        name: prod.name
                    });
                    continue;
                }

                const enhancedProd = {
                    name: prod.name,
                    purchase_rate: Number(prod.purchaseRate) || 0,
                    sales_rate_exc_dis_and_tax: Number(prod.sellingPrice) || 0,
                    sales_rate_inc_dis_and_tax: Number(prod.sellingPrice) || 0,
                    min_qty: 10,
                    max_qty: 10,
                    is_active: true,
                    display_on_pos: true,
                    is_batch: false,
                    auto_fill_on_demand_sheet: false,
                    non_inventory_item: false,
                    is_deal: false,
                    is_featured: false,
                    description: '',
                    pct_or_hs_code: '',
                    sku: '', // Empty SKU - will use existing or generate new
                    discount_amount: 0,
                    unit_name: prod.unit,
                    category_name: prod.category,
                    subcategory_name: '',
                    tax_name: '',
                    supplier_name: '',
                    brand_name: '',
                    color_name: '',
                    size_name: '',
                };

                // Validate required fields
                if (!enhancedProd.name) {
                    throw new Error('Missing required field: name');
                }
                
                if (!enhancedProd.sales_rate_exc_dis_and_tax) {
                    throw new Error('Missing required field: selling price');
                }

                console.log(`\n[${i + 1}/${herbsProducts.length}] Processing: ${enhancedProd.name}`);
                console.log(`   Unit: ${enhancedProd.unit_name} | Category: ${enhancedProd.category_name}`);
                console.log(`   Purchase Rate: ${enhancedProd.purchase_rate}`);
                console.log(`   Selling Price: ${enhancedProd.sales_rate_exc_dis_and_tax}`);

                const result = await productService.createProductFromBulkUpload(enhancedProd);
                
                results.push({ 
                    success: true, 
                    id: result.id, 
                    name: result.name,
                    unit: result.unit?.name || 'Unknown',
                    category: result.category?.name || 'Unknown'
                });
                
                successCount++;
                console.log(`   ✅ Success - ${result.id}`);
            } catch (err: any) {
                errorCount++;
                const errorMsg = err.message || 'Unknown error';
                console.log(`   ❌ Error: ${errorMsg}`);
                results.push({ 
                    success: false, 
                    error: errorMsg, 
                    data: prod 
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`⚠️  Skipped (0 price): ${skippedCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📦 Total: ${herbsProducts.length}`);
        console.log('='.repeat(60));

        // Save results to file
        const resultsPath = require('path').join(__dirname, '../../herbs-update-results.json');
        require('fs').writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${resultsPath}`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
updateHerbsPricing()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });


