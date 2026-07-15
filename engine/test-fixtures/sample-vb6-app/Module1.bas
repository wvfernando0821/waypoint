Attribute VB_Name = "Module1"

Private Const ConnString As String = "Provider=SQLOLEDB;Data Source=localhost;Initial Catalog=ClinicDb;User Id=sa;Password=changeme;"

Public Sub InsertCustomer(firstName As String, lastName As String, dateOfBirth As Date, insuranceId As String)
    Dim conn As Object
    Dim cmd As Object

    Set conn = CreateObject("ADODB.Connection")
    conn.Open ConnString

    Set cmd = CreateObject("ADODB.Command")
    cmd.ActiveConnection = conn
    cmd.CommandText = "INSERT INTO Customers (FirstName, LastName, DateOfBirth, InsuranceId) VALUES (?, ?, ?, ?)"
    cmd.Parameters.Append cmd.CreateParameter("FirstName", 200, 1, 50, firstName)
    cmd.Parameters.Append cmd.CreateParameter("LastName", 200, 1, 50, lastName)
    cmd.Parameters.Append cmd.CreateParameter("DateOfBirth", 7, 1, , dateOfBirth)
    cmd.Parameters.Append cmd.CreateParameter("InsuranceId", 200, 1, 50, insuranceId)
    cmd.Execute

    conn.Close
End Sub

Public Function GetAllCustomers() As Object
    Dim conn As Object
    Dim rs As Object

    Set conn = CreateObject("ADODB.Connection")
    conn.Open ConnString

    Set rs = CreateObject("ADODB.Recordset")
    rs.Open "SELECT Id, FirstName, LastName, DateOfBirth, InsuranceId FROM Customers ORDER BY LastName", conn

    Set GetAllCustomers = rs
End Function

Public Sub UpdateCustomer(customerId As Long, firstName As String, lastName As String, dateOfBirth As Date, insuranceId As String)
    Dim conn As Object
    Dim cmd As Object

    Set conn = CreateObject("ADODB.Connection")
    conn.Open ConnString

    Set cmd = CreateObject("ADODB.Command")
    cmd.ActiveConnection = conn
    cmd.CommandText = "UPDATE Customers SET FirstName = ?, LastName = ?, DateOfBirth = ?, InsuranceId = ? WHERE Id = ?"
    cmd.Parameters.Append cmd.CreateParameter("FirstName", 200, 1, 50, firstName)
    cmd.Parameters.Append cmd.CreateParameter("LastName", 200, 1, 50, lastName)
    cmd.Parameters.Append cmd.CreateParameter("DateOfBirth", 7, 1, , dateOfBirth)
    cmd.Parameters.Append cmd.CreateParameter("InsuranceId", 200, 1, 50, insuranceId)
    cmd.Parameters.Append cmd.CreateParameter("Id", 3, 1, , customerId)
    cmd.Execute

    conn.Close
End Sub

Public Sub DeleteCustomer(customerId As Long)
    Dim conn As Object
    Dim cmd As Object

    Set conn = CreateObject("ADODB.Connection")
    conn.Open ConnString

    Set cmd = CreateObject("ADODB.Command")
    cmd.ActiveConnection = conn
    cmd.CommandText = "DELETE FROM Customers WHERE Id = ?"
    cmd.Parameters.Append cmd.CreateParameter("Id", 3, 1, , customerId)
    cmd.Execute

    conn.Close
End Sub

Public Function FindCustomerId(lastName As String) As Variant
    Dim conn As Object
    Dim rs As Object
    Dim sql As String

    Set conn = CreateObject("ADODB.Connection")
    conn.Open "Provider=SQLOLEDB;Data Source=localhost;Initial Catalog=ClinicDb;User Id=sa;Password=changeme;"

    ' Deliberately risky: last name concatenated directly into the query.
    sql = "SELECT Id FROM Customers WHERE LastName = '" & lastName & "'"

    Set rs = conn.Execute(sql)
    If Not rs.EOF Then
        FindCustomerId = rs.Fields("Id").Value
    Else
        FindCustomerId = Null
    End If

    conn.Close
End Function
