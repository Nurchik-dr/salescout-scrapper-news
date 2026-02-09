import java.util.*;

// ===== Order & SRP =====
class Order {
    String productName;
    int quantity;
    double price;
}

class OrderPriceCalculator {
    public double calculateTotalPrice(Order order) {
        return order.quantity * order.price * 0.9;
    }
}

class PaymentProcessor {
    public void processPayment(String paymentDetails) {
        System.out.println("Payment processed using: " + paymentDetails);
    }
}

class NotificationSender {
    public void sendEmail(String email) {
        System.out.println("Confirmation email sent to: " + email);
    }
}

// ===== OCP =====
class Employee {
    String name;
    double baseSalary;
}

interface SalaryCalculator {
    double calculate(Employee employee);
}

class PermanentEmployeeSalary implements SalaryCalculator {
    public double calculate(Employee employee) {
        return employee.baseSalary * 1.2;
    }
}

class ContractEmployeeSalary implements SalaryCalculator {
    public double calculate(Employee employee) {
        return employee.baseSalary * 1.1;
    }
}

class InternEmployeeSalary implements SalaryCalculator {
    public double calculate(Employee employee) {
        return employee.baseSalary * 0.8;
    }
}

class SalaryService {
    private SalaryCalculator calculator;

    public SalaryService(SalaryCalculator calculator) {
        this.calculator = calculator;
    }

    public double calculateSalary(Employee employee) {
        return calculator.calculate(employee);
    }
}

// ===== ISP =====
interface Print {
    void print(String content);
}

interface Scan {
    void scan(String content);
}

interface Fax {
    void fax(String content);
}

class AllInOnePrinter implements Print, Scan, Fax {
    public void print(String content) {
        System.out.println("Printing: " + content);
    }

    public void scan(String content) {
        System.out.println("Scanning: " + content);
    }

    public void fax(String content) {
        System.out.println("Faxing: " + content);
    }
}

class BasicPrinter implements Print {
    public void print(String content) {
        System.out.println("Printing: " + content);
    }
}

// ===== DIP =====
interface MessageSender {
    void send(String message);
}

class EmailSender implements MessageSender {
    public void send(String message) {
        System.out.println("Email sent: " + message);
    }
}

class SmsSender implements MessageSender {
    public void send(String message) {
        System.out.println("SMS sent: " + message);
    }
}

class NotificationService {
    private List<MessageSender> senders;

    public NotificationService(List<MessageSender> senders) {
        this.senders = senders;
    }

    public void sendNotification(String message) {
        for (MessageSender sender : senders) {
            sender.send(message);
        }
    }
}

// ===== Main =====
public class Main {
    public static void main(String[] args) {

        Order order = new Order();
        order.productName = "Laptop";
        order.quantity = 2;
        order.price = 500;

        OrderPriceCalculator priceCalc = new OrderPriceCalculator();
        System.out.println(priceCalc.calculateTotalPrice(order));

        Employee emp = new Employee();
        emp.name = "Ali";
        emp.baseSalary = 1000;

        SalaryService salaryService =
                new SalaryService(new PermanentEmployeeSalary());
        System.out.println(salaryService.calculateSalary(emp));

        Print printer = new BasicPrinter();
        printer.print("Hello");

        List<MessageSender> senders = new ArrayList<>();
        senders.add(new EmailSender());
        senders.add(new SmsSender());

        NotificationService notificationService =
                new NotificationService(senders);
        notificationService.sendNotification("Hello SOLID!");
    }
}