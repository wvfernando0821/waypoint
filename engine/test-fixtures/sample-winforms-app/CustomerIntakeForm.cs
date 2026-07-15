using System;
using System.Windows.Forms;
using SampleApp.Data;

namespace SampleApp
{
    // Hand-written half of the form — the paired CustomerIntakeForm.Designer.cs
    // holds the InitializeComponent() boilerplate.
    public partial class CustomerIntakeForm : Form
    {
        private readonly CustomerRepository _customerRepository = new CustomerRepository();

        public CustomerIntakeForm()
        {
            InitializeComponent();
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

            _customerRepository.InsertCustomer(txtFirstName.Text, txtLastName.Text, dateOfBirth, txtInsuranceId.Text);
            MessageBox.Show("Customer saved.");
        }
    }
}
