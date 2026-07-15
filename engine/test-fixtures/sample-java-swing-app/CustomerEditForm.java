import javax.swing.*;
import java.sql.*;

// Paired with the NetBeans GUI builder metadata in CustomerEditForm.form.
public class CustomerEditForm extends JFrame {

    private JTextField txtFirstName;
    private JTextField txtLastName;
    private JTextField txtDateOfBirth;
    private JTextField txtInsuranceId;
    private JButton btnSave;

    private final int customerId;

    public CustomerEditForm(int customerId) {
        this.customerId = customerId;
        btnSave.addActionListener(e -> onSave());
        loadCustomer();
    }

    // Business logic embedded directly in the listener/constructor,
    // matching the pattern already established in MainForm.
    private void loadCustomer() {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            PreparedStatement stmt = conn.prepareStatement(
                    "SELECT first_name, last_name, date_of_birth, insurance_id FROM customers WHERE id = ?");
            stmt.setInt(1, customerId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                txtFirstName.setText(rs.getString("first_name"));
                txtLastName.setText(rs.getString("last_name"));
                txtDateOfBirth.setText(rs.getDate("date_of_birth").toString());
                txtInsuranceId.setText(rs.getString("insurance_id"));
            } else {
                JOptionPane.showMessageDialog(this, "Customer not found.");
                dispose();
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Could not load customer: " + ex.getMessage());
        }
    }

    private void onSave() {
        if (txtFirstName.getText().isBlank() || txtLastName.getText().isBlank()) {
            JOptionPane.showMessageDialog(this, "First and last name are required.");
            return;
        }

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            PreparedStatement stmt = conn.prepareStatement(
                    "UPDATE customers SET first_name = ?, last_name = ?, date_of_birth = ?, insurance_id = ? WHERE id = ?");
            stmt.setString(1, txtFirstName.getText());
            stmt.setString(2, txtLastName.getText());
            stmt.setString(3, txtDateOfBirth.getText());
            stmt.setString(4, txtInsuranceId.getText());
            stmt.setInt(5, customerId);
            stmt.executeUpdate();
            JOptionPane.showMessageDialog(this, "Customer updated.");
            dispose();
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Could not update customer: " + ex.getMessage());
        }
    }
}
