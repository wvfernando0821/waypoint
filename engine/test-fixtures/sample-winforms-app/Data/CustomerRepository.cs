using System;
using System.Data.SqlClient;

namespace SampleApp.Data
{
    // Direct ADO.NET data access — no ORM. Connection string hardcoded here,
    // as is common in older WinForms apps.
    public class CustomerRepository
    {
        private const string ConnectionString =
            "Server=localhost;Database=ClinicDb;User Id=sa;Password=changeme;";

        public void InsertCustomer(string firstName, string lastName, DateTime dateOfBirth, string insuranceId)
        {
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(
                "INSERT INTO Customers (FirstName, LastName, DateOfBirth, InsuranceId) VALUES (@FirstName, @LastName, @DateOfBirth, @InsuranceId)",
                connection))
            {
                command.Parameters.AddWithValue("@FirstName", firstName);
                command.Parameters.AddWithValue("@LastName", lastName);
                command.Parameters.AddWithValue("@DateOfBirth", dateOfBirth);
                command.Parameters.AddWithValue("@InsuranceId", insuranceId);
                connection.Open();
                command.ExecuteNonQuery();
            }
        }

        public void RecordPayment(string customerId, decimal amount)
        {
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(
                "INSERT INTO Payments (CustomerId, Amount, PaidAt) VALUES (@CustomerId, @Amount, GETDATE())",
                connection))
            {
                command.Parameters.AddWithValue("@CustomerId", customerId);
                command.Parameters.AddWithValue("@Amount", amount);
                connection.Open();
                command.ExecuteNonQuery();
            }
        }

        // Deliberately risky: the search term is concatenated directly into
        // the query string instead of using a parameter.
        public string FindCustomerIdByLastName(string lastName)
        {
            using (var connection = new SqlConnection(ConnectionString))
            using (var command = new SqlCommand(
                "SELECT Id FROM Customers WHERE LastName = '" + lastName + "'",
                connection))
            {
                connection.Open();
                var result = command.ExecuteScalar();
                return result != null ? result.ToString() : null;
            }
        }
    }
}
