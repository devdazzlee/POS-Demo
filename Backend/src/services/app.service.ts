import { CategoryService } from "./category.service";
import { ProductService } from "./product.service";

const productService = new ProductService();
const categoryService = new CategoryService();


class AppService {
    private productService: ProductService;
    private categoryService: CategoryService;

    constructor() {
        this.productService = productService;
        this.categoryService = categoryService;
    }
    
    public async getHomeData() {
        const [featuredProducts, bestSellingProducts, categories] = await Promise.all([
            this.productService.getFeaturedProducts(),
            this.productService.getBestSellingProducts(),
            this.categoryService.getCategories(),
        ]);

        return {
            featuredProducts,
            bestSellingProducts,
            categories,
        };
    };

    public async searchProducts(query: string, limit?: number) {
        const products = await this.productService.getProductByNameSearch(query, limit);
        return products;
    }

    public async getProductById(id: string) {
        const product = await this.productService.getProductById(id);
        return product;
    }

    public async getCategories() {
        return this.categoryService.getCategories();
    }
}

export default AppService;