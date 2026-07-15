import javax.swing.*;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

// Paired with the NetBeans GUI builder metadata in CustomerListForm.form.
public class CustomerListForm extends JFrame {

    private JList<String> lstCustomers;
    private JButton btnAddNew;
    private JButton btnEdit;
    private JButton btnDelete;
    private JButton btnRefresh;

    // Parallel list: customerIds.get(i) is the database id for row i.
    private final List<Integer> customerIds = new ArrayList<>();
    private final DefaultListModel<String> listModel = new DefaultListModel<>();

    public CustomerListForm() {
        lstCustomers.setModel(listModel);
        btnAddNew.addActionListener(e -> onAddNew());
        btnEdit.addActionListener(e -> onEdit());
        btnDelete.addActionListener(e -> onDelete());
        btnRefresh.addActionListener(e -> loadCustomers());
        loadCustomers();
    }

    // Business logic embedded directly in the listener, matching the
    // pattern already established in MainForm.
    private void loadCustomers() {
        listModel.clear();
        customerIds.clear();
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(
                    "SELECT id, first_name, last_name FROM customers ORDER BY last_name");
            while (rs.next()) {
                listModel.addElement(rs.getString("last_name") + ", " + rs.getString("first_name")
                        + " (Id " + rs.getInt("id") + ")");
                customerIds.add(rs.getInt("id"));
            }
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Could not load customers: " + ex.getMessage());
        }
    }

    private void onAddNew() {
        CustomerAddForm form = new CustomerAddForm();
        form.setVisible(true);
        loadCustomers();
    }

    private void onEdit() {
        int index = lstCustomers.getSelectedIndex();
        if (index < 0) {
            JOptionPane.showMessageDialog(this, "Select a customer first.");
            return;
        }
        CustomerEditForm form = new CustomerEditForm(customerIds.get(index));
        form.setVisible(true);
        loadCustomers();
    }

    private void onDelete() {
        int index = lstCustomers.getSelectedIndex();
        if (index < 0) {
            JOptionPane.showMessageDialog(this, "Select a customer first.");
            return;
        }
        int confirm = JOptionPane.showConfirmDialog(this, "Delete this customer?");
        if (confirm != JOptionPane.YES_OPTION) {
            return;
        }
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/clinicdb", "root", "changeme")) {
            PreparedStatement stmt = conn.prepareStatement("DELETE FROM customers WHERE id = ?");
            stmt.setInt(1, customerIds.get(index));
            stmt.executeUpdate();
            loadCustomers();
        } catch (SQLException ex) {
            JOptionPane.showMessageDialog(this, "Could not delete customer: " + ex.getMessage());
        }
    }
}
