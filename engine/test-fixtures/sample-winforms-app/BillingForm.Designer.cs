namespace SampleApp
{
    partial class BillingForm
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.txtCustomerId = new System.Windows.Forms.TextBox();
            this.txtAmount = new System.Windows.Forms.TextBox();
            this.btnCharge = new System.Windows.Forms.Button();

            this.txtCustomerId.Location = new System.Drawing.Point(120, 20);
            this.txtAmount.Location = new System.Drawing.Point(120, 50);
            this.btnCharge.Location = new System.Drawing.Point(120, 90);
            this.btnCharge.Text = "Charge Payment";
            this.btnCharge.Click += new System.EventHandler(this.btnCharge_Click);

            this.Controls.Add(this.txtCustomerId);
            this.Controls.Add(this.txtAmount);
            this.Controls.Add(this.btnCharge);
            this.Text = "Billing";
        }

        #endregion

        private System.Windows.Forms.TextBox txtCustomerId;
        private System.Windows.Forms.TextBox txtAmount;
        private System.Windows.Forms.Button btnCharge;
    }
}
