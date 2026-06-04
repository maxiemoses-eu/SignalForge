@RestController
@RequestMapping("/orders")
public class OrderController {

    private final List<String> orders = new ArrayList<>();

    @PostMapping
    public ResponseEntity<String> create(@RequestBody String order) {
        orders.add(order);
        return ResponseEntity.status(HttpStatus.CREATED).body("created");
    }

    @GetMapping
    public List<String> all() {
        return orders;
    }
}
