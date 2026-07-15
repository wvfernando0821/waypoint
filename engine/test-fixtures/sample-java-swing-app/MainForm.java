import javax.swing.*;
import java.sql.*;

// Paired with the NetBeans GUI builder metadata in MainForm.form.
public class MainForm extends JFrame {

    private JTextField txtLastName;
    private JButton btnSearch;

    public MainForm() {
        btnSearch.addActionListener(e -> onSearch());
    }

    // Business logic embedded directly in the listener rather than a
    // separate service/data-access layer.
    private void onSearch() {
        String lastName = txtLastName.getText();
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            Statement stmt = conn.createStatement();
            // Deliberately risky: last name concatenated directly into the query.
            ResultSet rs = stmt.executeQuery(
                    "SELECT id FROM customers WHERE last_name = '" + lastName + "'");
            if (rs.next()) {
                JOptionPane.showMessageDialog(this, "Customer ID: " + rs.getInt("id"));
            }
        } catch (SQLException ex) {
            // Swallowed: no logging, no user-visible error beyond a silent no-op.
        }
    }
}
