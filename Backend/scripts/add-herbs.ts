import { ProductService } from '../src/services/product.service';
import { prisma } from '../src/prisma/client';

interface ProductInput {
    name: string;
    unit: string;
    category: string;
    purchase_rate?: number;
    selling_price: number;
}

const products: ProductInput[] = [
    { name: "Aelwa", unit: "Kgs", category: "Herbs", purchase_rate: 2400, selling_price: 8000 },
    { name: "Akarkara", unit: "Kgs", category: "Herbs", purchase_rate: 3200, selling_price: 38000 },
    { name: "Akash Bail", unit: "Kgs", category: "Herbs", purchase_rate: 2500, selling_price: 8000 },
    { name: "Amaltas Phalli (Gurmara)", unit: "Kgs", category: "Herbs", purchase_rate: 90, selling_price: 600 },
    { name: "Amba Turmeric (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 850, selling_price: 3200 },
    { name: "Amba Turmeric (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 430, selling_price: 2400 },
    { name: "Amla (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1000 },
    { name: "Amla Gandak", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 3600 },
    { name: "Amla powder", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 1500 },
    { name: "Amla Ka Chilkha", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 1200 },
    { name: "Anaar ka Chilka", unit: "Kgs", category: "Herbs", purchase_rate: 60, selling_price: 1600 },
    { name: "Anar ke Phool", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 10000 },
    { name: "Arjun ki Chaal", unit: "Kgs", category: "Herbs", purchase_rate: 120, selling_price: 2400 },
    { name: "Asad Patta", unit: "Kgs", category: "Herbs", purchase_rate: 350, selling_price: 1600 },
    { name: "Asgand Nagori (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 1400, selling_price: 5600 },
    { name: "Asgand Nagori Powder", unit: "Kgs", category: "Herbs", purchase_rate: 1500, selling_price: 6000 },
    { name: "Askhar Makki", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 8000 },
    { name: "Ast e Quddus (Dried Lavender)", unit: "Kgs", category: "Herbs", purchase_rate: 350, selling_price: 2800 },
    { name: "Ount Kattara", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 2400 },
    { name: "Baalchar", unit: "Kgs", category: "Herbs", purchase_rate: 1800, selling_price: 8000 },
    { name: "Baapchi", unit: "Kgs", category: "Herbs", purchase_rate: 1300, selling_price: 7200 },
    { name: "Badam ki Chal", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 3200 },
    { name: "Bahi Whole", unit: "Kgs", category: "Herbs", purchase_rate: 1200, selling_price: 4800 },
    { name: "Banafsha Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 240, selling_price: 8000 },
    { name: "Bhringraj (Bhangra Sia)", unit: "Kgs", category: "Herbs", purchase_rate: 120, selling_price: 1800 },
    { name: "Barahimi booty", unit: "Kgs", category: "Herbs", purchase_rate: 650, selling_price: 8000 },
    { name: "Bareman Safaid", unit: "Kgs", category: "Herbs", purchase_rate: 150, selling_price: 1600 },
    { name: "Bareman Surkh", unit: "Kgs", category: "Herbs", purchase_rate: 150, selling_price: 1600 },
    { name: "Barg e Sanobar", unit: "Pcs", category: "Herbs", purchase_rate: 1600, selling_price: 8000 },
    { name: "Bargh e Sadab (Garden Rue)", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 2800 },
    { name: "Barghe Gaozaban", unit: "Kgs", category: "Herbs", purchase_rate: 720, selling_price: 8000 },
    { name: "Bari Harr Ka Chilka", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1400 },
    { name: "Bari Harr (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 320, selling_price: 2400 },
    { name: "Bari Harr Powder", unit: "Kgs", category: "Herbs", purchase_rate: 420, selling_price: 2600 },
    { name: "Barry Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 160, selling_price: 1200 },
    { name: "Berah Chilka", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1400 },
    { name: "Bahera (Beleric Myrobalan - Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 220, selling_price: 2400 },
    { name: "Bahera (Beleric Myrobalan - Powder)", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 2800 },
    { name: "Bahi Dana", unit: "Kgs", category: "Herbs", purchase_rate: 4200, selling_price: 28000 },
    { name: "Bichu Booty", unit: "Kgs", category: "Herbs", purchase_rate: 900, selling_price: 3600 },
    { name: "Biscuit Katha", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 1600 },
    { name: "Bitter Gourd - Jaman Powder", unit: "Pcs", category: "Herbs", purchase_rate: 0, selling_price: 350 },
    { name: "Bitter Melon Plum Powder (Karaila jaman)", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 3500 },
    { name: "Camphor", unit: "Pcs", category: "Herbs", purchase_rate: 11.43, selling_price: 30 },
    { name: "Carrot Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 1600 },
    { name: "Chandan Booty (Choti Chandan)", unit: "Kgs", category: "Herbs", purchase_rate: 2600, selling_price: 4800 },
    { name: "Charaita", unit: "Kgs", category: "Herbs", purchase_rate: 320, selling_price: 8000 },
    { name: "Charonji", unit: "Kgs", category: "Herbs", purchase_rate: 7000, selling_price: 8800 },
    { name: "Chasku", unit: "Kgs", category: "Herbs", purchase_rate: 3500, selling_price: 4800 },
    { name: "Chatrak", unit: "Kgs", category: "Herbs", purchase_rate: 100, selling_price: 220 },
    { name: "Chia Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 960, selling_price: 2400 },
    { name: "Chia Seeds Imported", unit: "Kgs", category: "Herbs", purchase_rate: 1100, selling_price: 5800 },
    { name: "Chikni Chahliya", unit: "Kgs", category: "Herbs", purchase_rate: 3500, selling_price: 5200 },
    { name: "Chop Cheeni (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 3400, selling_price: 6400 },
    { name: "Chop Cheeni (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 550, selling_price: 1800 },
    { name: "Choti Harr (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 950, selling_price: 2600 },
    { name: "Choti Harr Powder", unit: "Kgs", category: "Herbs", purchase_rate: 1050, selling_price: 2800 },
    { name: "Chout Saddi", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 1200 },
    { name: "Dhamasa Booty", unit: "Kgs", category: "Herbs", purchase_rate: 100, selling_price: 8000 },
    { name: "Dried Lemon", unit: "Kgs", category: "Herbs", purchase_rate: 680, selling_price: 1600 },
    { name: "Dried Mint (Pahari)", unit: "Kgs", category: "Herbs", purchase_rate: 280, selling_price: 1800 },
    { name: "Eyesight And Brain Powder ( Box )", unit: "Pcs", category: "Herbs", purchase_rate: 650, selling_price: 1500 },
    { name: "Face Mask", unit: "Pcs", category: "Herbs", purchase_rate: 400, selling_price: 800 },
    { name: "Falsay ki chaal", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 2400 },
    { name: "Flax Seed (Alsi)", unit: "Kgs", category: "Herbs", purchase_rate: 360, selling_price: 1000 },
    { name: "Flax seed Powder (Alsi powder)", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1400 },
    { name: "Ganda Beroza", unit: "Kgs", category: "Herbs", purchase_rate: 650, selling_price: 2800 },
    { name: "Gandak (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 150, selling_price: 600 },
    { name: "Ganderi Katha", unit: "Kgs", category: "Herbs", purchase_rate: 2200, selling_price: 4800 },
    { name: "Gandhari Waj", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 2400 },
    { name: "Ghokru Powder", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 5000 },
    { name: "Ghokru Whole", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 4800 },
    { name: "Gondh Kateera (Tragacanth Gum)", unit: "Kgs", category: "Herbs", purchase_rate: 1200, selling_price: 3600 },
    { name: "Googal", unit: "Kgs", category: "Herbs", purchase_rate: 2600, selling_price: 7200 },
    { name: "Green Tea Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 2000 },
    { name: "Gul e Babuna (Chamomile)", unit: "Kgs", category: "Herbs", purchase_rate: 900, selling_price: 2800 },
    { name: "Gul e Banafsha (Sweet Violet)", unit: "Kgs", category: "Herbs", purchase_rate: 1700, selling_price: 8000 },
    { name: "Gul e Bukhoor", unit: "Kgs", category: "Herbs", purchase_rate: 350, selling_price: 2400 },
    { name: "Gul E Gorail", unit: "Kgs", category: "Herbs", purchase_rate: 1800, selling_price: 10000 },
    { name: "Gul e Supari", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 2400 },
    { name: "Dried Rose Powder", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 1800 },
    { name: "Dried Rose Petals", unit: "Kgs", category: "Herbs", purchase_rate: 150, selling_price: 1600 },
    { name: "Gulmundi", unit: "Kgs", category: "Herbs", purchase_rate: 550, selling_price: 1600 },
    { name: "Gurmaar Booty", unit: "Kgs", category: "Herbs", purchase_rate: 1300, selling_price: 3600 },
    { name: "Halun Dana", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 1600 },
    { name: "Harmal (Kala Dana)", unit: "Kgs", category: "Herbs", purchase_rate: 240, selling_price: 800 },
    { name: "Hartal", unit: "Kgs", category: "Herbs", purchase_rate: 18000, selling_price: 28000 },
    { name: "Height Growth Powwder ( Box )", unit: "Pcs", category: "Herbs", purchase_rate: 450, selling_price: 1200 },
    { name: "Hibiscus Flowers", unit: "Kgs", category: "Herbs", purchase_rate: 2200, selling_price: 6000 },
    { name: "Hibiscus Powder", unit: "Kgs", category: "Herbs", purchase_rate: 3500, selling_price: 7000 },
    { name: "Hing (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 7000, selling_price: 20000 },
    { name: "Hing (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 5200, selling_price: 20000 },
    { name: "Husn e Yousuf", unit: "Kgs", category: "Herbs", purchase_rate: 1400, selling_price: 10000 },
    { name: "Imli Ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 140, selling_price: 480 },
    { name: "Indar Jaww (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 1800 },
    { name: "Indar Jaww (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 1200, selling_price: 2400 },
    { name: "Indigo Powder", unit: "Kgs", category: "Herbs", purchase_rate: 2800, selling_price: 4500 },
    { name: "Ispaghol (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 1800 },
    { name: "Ispaghol Bhoosi", unit: "Kgs", category: "Herbs", purchase_rate: 3600, selling_price: 6200 },
    { name: "Jaman powder", unit: "Kgs", category: "Herbs", purchase_rate: 170, selling_price: 3500 },
    { name: "Jaman Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 100, selling_price: 1600 },
    { name: "Ginseng", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 9000 },
    { name: "Joint Pain Powder", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1400 },
    { name: "Kabab Cheeni", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 2400 },
    { name: "Kahu Ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 1300, selling_price: 2800 },
    { name: "Kaisu Flowers", unit: "Kgs", category: "Herbs", purchase_rate: 280, selling_price: 1000 },
    { name: "Kakachiya", unit: "Kgs", category: "Herbs", purchase_rate: 1000, selling_price: 4800 },
    { name: "Kakar Singhi (Pistacia Integerrima)", unit: "Kgs", category: "Herbs", purchase_rate: 350, selling_price: 1600 },
    { name: "Kali Moosli", unit: "Kgs", category: "Herbs", purchase_rate: 2400, selling_price: 12000 },
    { name: "Kali Zeeri", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 1600 },
    { name: "Kalmi Shoura", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 1000 },
    { name: "Kamarkas", unit: "Kgs", category: "Herbs", purchase_rate: 1600, selling_price: 2800 },
    { name: "Kamila Powder", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 2400 },
    { name: "Kundar Goond", unit: "Kgs", category: "Herbs", purchase_rate: 1600, selling_price: 8000 },
    { name: "Kapoor Kachri (Ginger Lily)", unit: "Kgs", category: "Herbs", purchase_rate: 2600, selling_price: 4200 },
    { name: "Karu / Kutki (Picrorhiza Kurroa)", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 3600 },
    { name: "Kashkari", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 1200 },
    { name: "Kasni ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 1600 },
    { name: "Kast e Shirin (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 550, selling_price: 14000 },
    { name: "Kast e Shirin (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 240, selling_price: 12000 },
    { name: "Kast ul Bahri (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 1600 },
    { name: "Kast ul Bahri (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 1200 },
    { name: "Kast ul Hindi (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 320, selling_price: 1600 },
    { name: "Kast ul Hindi (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 1200 },
    { name: "Katla Powder", unit: "Kgs", category: "Herbs", purchase_rate: 3200, selling_price: 6000 },
    { name: "Khakseer", unit: "Kgs", category: "Herbs", purchase_rate: 850, selling_price: 1800 },
    { name: "Kini Kate", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 3600 },
    { name: "Koonj Ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 2400 },
    { name: "Kor Tumba", unit: "Kgs", category: "Herbs", purchase_rate: 160, selling_price: 1800 },
    { name: "Kor Tumba (Seeds)", unit: "Kgs", category: "Herbs", purchase_rate: 160, selling_price: 1600 },
    { name: "Kulfay Ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 550, selling_price: 2400 },
    { name: "Kulti ki Daal", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 960 },
    { name: "Laak Dana", unit: "Kgs", category: "Herbs", purchase_rate: 4600, selling_price: 7200 },
    { name: "Lajwanti", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 1600 },
    { name: "Lasora Whole", unit: "Kgs", category: "Herbs", purchase_rate: 120, selling_price: 4800 },
    { name: "Lauq e Sapistan (Dried Lasoorah)", unit: "Kgs", category: "Herbs", purchase_rate: 1200, selling_price: 4800 },
    { name: "Lemon Tea Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 2000 },
    { name: "Luban", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 800 },
    { name: "Magaz Banola", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 4800 },
    { name: "Maida Lakri", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 3200 },
    { name: "Majoun", unit: "Pcs", category: "Herbs", purchase_rate: 500, selling_price: 2200 },
    { name: "Maju Phal", unit: "Kgs", category: "Herbs", purchase_rate: 2400, selling_price: 4800 },
    { name: "Makoh Daana", unit: "Kgs", category: "Herbs", purchase_rate: 480, selling_price: 1600 },
    { name: "Male Sexual Problem Powder ( box )", unit: "Pcs", category: "Herbs", purchase_rate: 800, selling_price: 2500 },
    { name: "Marathi Mogo", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 1600 },
    { name: "Marmaki", unit: "Kgs", category: "Herbs", purchase_rate: 4000, selling_price: 5600 },
    { name: "Mehandi", unit: "Kgs", category: "Herbs", purchase_rate: 230, selling_price: 600 },
    { name: "Mehandi ke Patte", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 1000 },
    { name: "Mint Capsule", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 1600 },
    { name: "Mochras", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 540 },
    { name: "Mooli Ke Beej", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 1600 },
    { name: "Moringa Capsule (60)", unit: "Pcs", category: "Herbs", purchase_rate: 320, selling_price: 1150 },
    { name: "Moringa Powder Box 100 GM", unit: "Pcs", category: "Herbs", purchase_rate: 250, selling_price: 700 },
    { name: "Moringa Powder Box 50 GM", unit: "Pcs", category: "Herbs", purchase_rate: 250, selling_price: 350 },
    { name: "MP Arq e Gulab (Spray)", unit: "Pcs", category: "Herbs", purchase_rate: 11.07, selling_price: 150 },
    { name: "Mulethi (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 1200 },
    { name: "Mulethi Powder", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1600 },
    { name: "Multani Mitti", unit: "Kgs", category: "Herbs", purchase_rate: 30, selling_price: 250 },
    { name: "Nagarmotha", unit: "Kgs", category: "Herbs", purchase_rate: 150, selling_price: 1600 },
    { name: "Nakhuna", unit: "Kgs", category: "Herbs", purchase_rate: 800, selling_price: 2400 },
    { name: "Narkachoor (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 560, selling_price: 3000 },
    { name: "Narkachoor (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 2400 },
    { name: "Nasboo Kay Beej", unit: "Kgs", category: "Herbs", purchase_rate: 440, selling_price: 1800 },
    { name: "Nawab Katha", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 2000 },
    { name: "Neebat", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 480 },
    { name: "Neela Tota", unit: "Kgs", category: "Herbs", purchase_rate: 540, selling_price: 1600 },
    { name: "Neem leaves", unit: "Kgs", category: "Herbs", purchase_rate: 140, selling_price: 1200 },
    { name: "Neem Powder", unit: "Kgs", category: "Herbs", purchase_rate: 160, selling_price: 3200 },
    { name: "Neem Seeds", unit: "Kgs", category: "Herbs", purchase_rate: 100, selling_price: 1600 },
    { name: "Nilofar ( Herbs )", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 900 },
    { name: "Nowshadar", unit: "Kgs", category: "Herbs", purchase_rate: 50, selling_price: 1000 },
    { name: "Orange peel Mask", unit: "Pcs", category: "Herbs", purchase_rate: 250, selling_price: 600 },
    { name: "Orange Peel Powder", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 2000 },
    { name: "Paan ki Char", unit: "Kgs", category: "Herbs", purchase_rate: 1000, selling_price: 2400 },
    { name: "Pabri Powder", unit: "Kgs", category: "Herbs", purchase_rate: 1400, selling_price: 1500 },
    { name: "Paneer booty", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 800 },
    { name: "Panja Moosli", unit: "Kgs", category: "Herbs", purchase_rate: 30000, selling_price: 65000 },
    { name: "panwar beej", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 1600 },
    { name: "Parshosha", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 8000 },
    { name: "Pathani Lout", unit: "Kgs", category: "Herbs", purchase_rate: 750, selling_price: 2400 },
    { name: "Pathri Faulad", unit: "Kgs", category: "Herbs", purchase_rate: 560, selling_price: 2800 },
    { name: "Patthar Ke Phool", unit: "Kgs", category: "Herbs", purchase_rate: 520, selling_price: 8000 },
    { name: "Peppermint", unit: "Kgs", category: "Herbs", purchase_rate: 7000, selling_price: 30000 },
    { name: "Phitkari", unit: "Kgs", category: "Herbs", purchase_rate: 120, selling_price: 600 },
    { name: "Phitkari (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 200, selling_price: 800 },
    { name: "Piplamor", unit: "Kgs", category: "Herbs", purchase_rate: 1300, selling_price: 4800 },
    { name: "Qamarband", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 70 },
    { name: "Raiwan cheeni", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 3600 },
    { name: "Ratanjot", unit: "Kgs", category: "Herbs", purchase_rate: 1200, selling_price: 8000 },
    { name: "Reetha (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 120, selling_price: 1000 },
    { name: "Reetha Powder", unit: "Kgs", category: "Herbs", purchase_rate: 220, selling_price: 1500 },
    { name: "Room e Mustagi", unit: "Kgs", category: "Herbs", purchase_rate: 48000, selling_price: 70000 },
    { name: "Rosemary Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 1500, selling_price: 8000 },
    { name: "Za'atar", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 2800 },
    { name: "Safaid Moosli (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 1300, selling_price: 30000 },
    { name: "Safaid Moosli (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 12800, selling_price: 28000 },
    { name: "Safaid Todri", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 1600 },
    { name: "Salab Misri", unit: "Kgs", category: "Herbs", purchase_rate: 28000, selling_price: 65000 },
    { name: "Salab Moosli", unit: "Kgs", category: "Herbs", purchase_rate: 30000, selling_price: 56000 },
    { name: "Samandri Jhaag", unit: "Kgs", category: "Herbs", purchase_rate: 1400, selling_price: 3600 },
    { name: "Senna Leaves", unit: "Kgs", category: "Herbs", purchase_rate: 300, selling_price: 2000 },
    { name: "Senna Leaves (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 260, selling_price: 2200 },
    { name: "Sandal Wood Powder", unit: "Kgs", category: "Herbs", purchase_rate: 180, selling_price: 2000 },
    { name: "Sang e Jarat", unit: "Kgs", category: "Herbs", purchase_rate: 1600, selling_price: 7000 },
    { name: "Sarson Ki Chaal", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 800 },
    { name: "Satte e Gilo (Tinospora Cordifolia)", unit: "Kgs", category: "Herbs", purchase_rate: 140, selling_price: 2400 },
    { name: "Sattawar", unit: "Kgs", category: "Herbs", purchase_rate: 3400, selling_price: 9600 },
    { name: "Satte Ajwain", unit: "Kgs", category: "Herbs", purchase_rate: 5200, selling_price: 30000 },
    { name: "Satte Kafoor", unit: "Kgs", category: "Herbs", purchase_rate: 4000, selling_price: 30000 },
    { name: "Satte Podena", unit: "Kgs", category: "Herbs", purchase_rate: 6000, selling_price: 30000 },
    { name: "Seepiyan", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 1600 },
    { name: "Shahtoot (Mulberry)", unit: "Kgs", category: "Herbs", purchase_rate: 850, selling_price: 1800 },
    { name: "Shilajit 0.5 gm", unit: "Pcs", category: "Herbs", purchase_rate: 120, selling_price: 1100 },
    { name: "Sikakai (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 440, selling_price: 1000 },
    { name: "Sikakai Powder", unit: "Kgs", category: "Herbs", purchase_rate: 500, selling_price: 1500 },
    { name: "Sindhoor", unit: "Kgs", category: "Herbs", purchase_rate: 950, selling_price: 4000 },
    { name: "Singhara (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 640, selling_price: 1400 },
    { name: "Singhara Powder", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 2000 },
    { name: "Soapnut Powder", unit: "Pcs", category: "Herbs", purchase_rate: 0, selling_price: 240 },
    { name: "Soya Dana", unit: "Kgs", category: "Herbs", purchase_rate: 480, selling_price: 1600 },
    { name: "Suhaga", unit: "Kgs", category: "Herbs", purchase_rate: 560, selling_price: 8000 },
    { name: "Suhanjna ki Gondh", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 7200 },
    { name: "Sumblo Booty", unit: "Kgs", category: "Herbs", purchase_rate: 280, selling_price: 2400 },
    { name: "Suranjan Powder", unit: "Kgs", category: "Herbs", purchase_rate: 4000, selling_price: 5600 },
    { name: "Suranjan Shirin (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 3600, selling_price: 5200 },
    { name: "Surkh Todri", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 1600 },
    { name: "Surma (Grounded)", unit: "Kgs", category: "Herbs", purchase_rate: 1100, selling_price: 2000 },
    { name: "Surma (Whole)", unit: "Kgs", category: "Herbs", purchase_rate: 1000, selling_price: 1600 },
    { name: "Tabasheer", unit: "Kgs", category: "Herbs", purchase_rate: 6000, selling_price: 28000 },
    { name: "Taramira Seeds (Arugula seeds)", unit: "Kgs", category: "Herbs", purchase_rate: 250, selling_price: 1200 },
    { name: "Timber", unit: "Kgs", category: "Herbs", purchase_rate: 480, selling_price: 2400 },
    { name: "Triflah", unit: "Kgs", category: "Herbs", purchase_rate: 600, selling_price: 2800 },
    { name: "Tukhm e Ispat", unit: "Kgs", category: "Herbs", purchase_rate: 360, selling_price: 1200 },
    { name: "Tukhm e Kurfas", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 1600 },
    { name: "Tukhm e Saras", unit: "Kgs", category: "Herbs", purchase_rate: 140, selling_price: 2400 },
    { name: "Tukhme Utangan", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 3600 },
    { name: "Turbat Safaid", unit: "Kgs", category: "Herbs", purchase_rate: 700, selling_price: 2800 },
    { name: "Ubtan", unit: "Kgs", category: "Herbs", purchase_rate: 960, selling_price: 2000 },
    { name: "Unaab ( Jujube)", unit: "Kgs", category: "Herbs", purchase_rate: 400, selling_price: 800 },
    { name: "Waqumba Beej", unit: "Kgs", category: "Herbs", purchase_rate: 450, selling_price: 4800 },
    { name: "Waras", unit: "Kgs", category: "Herbs", purchase_rate: 5200, selling_price: 28000 },
    { name: "Wawring", unit: "Kgs", category: "Herbs", purchase_rate: 1000, selling_price: 2400 },
    { name: "Weight loss powder", unit: "Kgs", category: "Herbs", purchase_rate: 350, selling_price: 3500 },
    { name: "Zarshak", unit: "Kgs", category: "Herbs", purchase_rate: 1150, selling_price: 2800 },
    { name: "Zerisht", unit: "Kgs", category: "Herbs", purchase_rate: 1600, selling_price: 36000 },
];

async function addAllProducts() {
    const productService = new ProductService();
    const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[],
    };

    console.log(`🚀 Starting to add ${products.length} products...\n`);

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
            // Handle products with 0 or missing prices
            let purchaseRate = product.purchase_rate && product.purchase_rate > 0 
                ? product.purchase_rate 
                : (product.selling_price > 0 ? Math.round(product.selling_price * 0.7) : 100);
            
            let sellingPrice = product.selling_price > 0 
                ? product.selling_price 
                : (purchaseRate > 0 ? Math.round(purchaseRate * 1.5) : 100);

            const created = await productService.createProductFromBulkUpload({
                name: product.name,
                category_name: product.category,
                unit_name: product.unit,
                purchase_rate: purchaseRate,
                sales_rate_exc_dis_and_tax: sellingPrice,
                sales_rate_inc_dis_and_tax: sellingPrice,
                min_qty: 10,
                max_qty: 10,
            });

            results.success.push(product.name);
            console.log(`✅ [${i + 1}/${products.length}] ${product.name} - Created (ID: ${created.id})`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            results.failed.push({ name: product.name, error: errorMessage });
            console.error(`❌ [${i + 1}/${products.length}] ${product.name} - Failed: ${errorMessage}`);
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully created: ${results.success.length} products`);
    console.log(`   ❌ Failed: ${results.failed.length} products`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed products:');
        results.failed.forEach(({ name, error }) => {
            console.log(`   - ${name}: ${error}`);
        });
    }
}

addAllProducts()
    .then(() => {
        console.log('\n✅ Process completed!');
        return prisma.$disconnect();
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });

