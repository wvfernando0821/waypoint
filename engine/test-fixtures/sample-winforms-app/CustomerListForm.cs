using System;
using System.Collections.Generic;
using System.Windows.Forms;
using SampleApp.Data;

namespace SampleApp
{
    // Hand-written half of the form — the paired CustomerListForm.Designer.cs
    // holds the InitializeComponent() boilerplate.
    public partial class CustomerListForm : Form
    {
        private readonly CustomerRepository _customerRepository = new CustomerRepository();
        private List<Customer> _customers = new List<Customer>();

        public CustomerListForm()
        {
            InitializeComponent();
        }

        private void CustomerListForm_Load(object sender, EventArgs e)
        {
            LoadCustomers();
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            LoadCustomers();
        }

        private void LoadCustomers()
        {
            _customers = _customerRepository.GetAllCustomers();
            lstCustomers.Items.Clear();
            foreach (var customer in _customers)
            {
                lstCustomers.Items.Add(customer.LastName + ", " + customer.FirstName + " (Id " + customer.Id + ")");
            }
        }

        private Customer GetSelectedCustomer()
        {
            if (lstCustomers.SelectedIndex < 0)
            {
                return null;
            }
            return _customers[lstCustomers.SelectedIndex];
        }

        private void btnAddNew_Click(object sender, EventArgs e)
        {
            using (var form = new CustomerIntakeForm())
            {
                form.ShowDialog();
            }
            LoadCustomers();
        }

        private void btnEdit_Click(object sender, EventArgs e)
        {
            var selected = GetSelectedCustomer();
            if (selected == null)
            {
                MessageBox.Show("Select a customer first.");
                return;
            }
            using (var form = new CustomerEditForm(selected.Id))
            {
                form.ShowDialog();
            }
            LoadCustomers();
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            var selected = GetSelectedCustomer();
            if (selected == null)
            {
                MessageBox.Show("Select a customer first.");
                return;
            }
            var confirm = MessageBox.Show(
                "Delete " + selected.FirstName + " " + selected.LastName + "?",
                "Confirm delete",
                MessageBoxButtons.YesNo);
            if (confirm == DialogResult.Yes)
            {
                _customerRepository.DeleteCustomer(selected.Id);
                LoadCustomers();
            }
        }
    }
}
