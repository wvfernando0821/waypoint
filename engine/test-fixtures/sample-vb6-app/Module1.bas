Attribute VB_Name = "Module1"

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
