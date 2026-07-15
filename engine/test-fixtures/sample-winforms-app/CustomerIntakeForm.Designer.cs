namespace SampleApp
{
    partial class CustomerIntakeForm
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
            this.txtFirstName = new System.Windows.Forms.TextBox();
            this.txtLastName = new System.Windows.Forms.TextBox();
            this.txtDateOfBirth = new System.Windows.Forms.TextBox();
            this.txtInsuranceId = new System.Windows.Forms.TextBox();
            this.btnSave = new System.Windows.Forms.Button();

            this.txtFirstName.Location = new System.Drawing.Point(120, 20);
            this.txtLastName.Location = new System.Drawing.Point(120, 50);
            this.txtDateOfBirth.Location = new System.Drawing.Point(120, 80);
            this.txtInsuranceId.Location = new System.Drawing.Point(120, 110);
            this.btnSave.Location = new System.Drawing.Point(120, 150);
            this.btnSave.Text = "Save";
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);

            this.Controls.Add(this.txtFirstName);
            this.Controls.Add(this.txtLastName);
            this.Controls.Add(this.txtDateOfBirth);
            this.Controls.Add(this.txtInsuranceId);
            this.Controls.Add(this.btnSave);
            this.Text = "Customer Intake";
        }

        #endregion

        private System.Windows.Forms.TextBox txtFirstName;
        private System.Windows.Forms.TextBox txtLastName;
        private System.Windows.Forms.TextBox txtDateOfBirth;
        private System.Windows.Forms.TextBox txtInsuranceId;
        private System.Windows.Forms.Button btnSave;
    }
}
