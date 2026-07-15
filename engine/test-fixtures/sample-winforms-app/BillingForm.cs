using System;
using System.Windows.Forms;
using SampleApp.Data;

namespace SampleApp
{
    public partial class BillingForm : Form
    {
        private readonly CustomerRepository _customerRepository = new CustomerRepository();

        public BillingForm()
        {
            InitializeComponent();
        }

        private void btnCharge_Click(object sender, EventArgs e)
        {
            var amount = decimal.Parse(txtAmount.Text);

            try
            {
                _customerRepository.RecordPayment(txtCustomerId.Text, amount);
                MessageBox.Show("Payment recorded.");
            }
            catch
            {
                // Deliberately swallowed: a failed payment write is silently
                // dropped here with no logging and no user-visible error.
            }
        }
    }
}
