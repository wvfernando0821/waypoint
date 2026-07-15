import javax.swing.*;
import java.sql.*;
import java.time.LocalDate;

// Paired with the NetBeans GUI builder metadata in CustomerAddForm.form.
public class CustomerAddForm extends JFrame {

    private JTextField txtFirstName;
    private JTextField txtLastName;
    private JTextField txtDateOfBirth;
    private JTextField txtInsuranceId;
    private JButton btnSave;

    public CustomerAddForm() {
        btnSave.addActionListener(e -> onSave());
    }

    // Business logic embedded directly in the listener, matching the
    // pattern already established in MainForm.
    private void onSave() {
        String firstName = txtFirstName.getText();
        String lastName = txtLastName.getText();
        if (firstName.isBlank() || lastName.isBlank()) {
            JOptionPane.showMessageDialog(this, "First and last name are required.");
            return;
        }

        LocalDate dateOfBirth;
        try {
            dateOfBirth = LocalDate.parse(txtDateOfBirth.getText());
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Date of birth is not valid.");
            return;
        }

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            PreparedStatement stmt = conn.prepareStatement(
                    "INSERT INTO customers (first_name, last_name, date_of_birth, insurance_id) VALUES (?, ?, ?, ?)");
            stmt.setString(1, firstName);
            stmt.setString(2, lastName);
            stmt.setObject(3, dateOfBirth);
            stmt.setString(4, txtInsuranceId.getText());
            stmt.executeUpdate();
            JOptionPane.showMessageDialog(this, "Customer saved.");
            dispose();
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Could not save customer: " + ex.getMessage());
        }
    }
}
