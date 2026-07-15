using System;
using System.Windows.Forms;
using SampleApp.Data;

namespace SampleApp
{
    // Hand-written half of the form — the paired CustomerEditForm.Designer.cs
    // holds the InitializeComponent() boilerplate.
    public partial class CustomerEditForm : Form
    {
        private readonly CustomerRepository _customerRepository = new CustomerRepository();
        private readonly int _customerId;

        public CustomerEditForm(int customerId)
        {
            _customerId = customerId;
            InitializeComponent();
        }

        private void CustomerEditForm_Load(object sender, EventArgs e)
        {
            var customer = _customerRepository.GetCustomerById(_customerId);
            if (customer == null)
            {
                MessageBox.Show("Customer not found.");
                Close();
                return;
            }
            txtFirstName.Text = customer.FirstName;
            txtLastName.Text = customer.LastName;
            txtDateOfBirth.Text = customer.DateOfBirth.ToShortDateString();
            txtInsuranceId.Text = customer.InsuranceId;
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtFirstName.Text) || string.IsNullOrWhiteSpace(txtLastName.Text))
            {
                MessageBox.Show("First and last name are required.");
                return;
            }

            if (!DateTime.TryParse(txtDateOfBirth.Text, out var dateOfBirth))
            {
                MessageBox.Show("Date of birth is not valid.");
                return;
            }

            _customerRepository.UpdateCustomer(_customerId, txtFirstName.Text, txtLastName.Text, dateOfBirth, txtInsuranceId.Text);
            MessageBox.Show("Customer updated.");
            Close();
        }
    }
}
