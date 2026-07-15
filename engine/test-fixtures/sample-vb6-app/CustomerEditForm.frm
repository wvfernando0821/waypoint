VERSION 5.00
Begin VB.Form CustomerEditForm
   Caption         =   "Edit Customer"
   ClientHeight    =   3200
   ClientWidth     =   4500
   Begin VB.TextBox txtFirstName
      Height          =   315
      Left            =   1200
      Top             =   240
   End
   Begin VB.TextBox txtLastName
      Height          =   315
      Left            =   1200
      Top             =   600
   End
   Begin VB.TextBox txtDateOfBirth
      Height          =   315
      Left            =   1200
      Top             =   960
   End
   Begin VB.TextBox txtInsuranceId
      Height          =   315
      Left            =   1200
      Top             =   1320
   End
   Begin VB.CommandButton cmdSave
      Caption         =   "Save changes"
      Height          =   375
      Left            =   1200
      Top             =   1800
   End
End
Attribute VB_Name = "CustomerEditForm"

' Set by CustomerListForm before showing this form.
Public CustomerId As Long

Private Sub Form_Load()
    Dim rs As Object

    Set rs = Module1.GetAllCustomers()
    Do While Not rs.EOF
        If rs.Fields("Id").Value = CustomerId Then
            txtFirstName.Text = rs.Fields("FirstName").Value
            txtLastName.Text = rs.Fields("LastName").Value
            txtDateOfBirth.Text = rs.Fields("DateOfBirth").Value
            txtInsuranceId.Text = rs.Fields("InsuranceId").Value
            Exit Do
        End If
        rs.MoveNext
    Loop
End Sub

Private Sub cmdSave_Click()
    If Trim(txtFirstName.Text) = "" Or Trim(txtLastName.Text) = "" Then
        MsgBox "First and last name are required."
        Exit Sub
    End If

    If Not IsDate(txtDateOfBirth.Text) Then
        MsgBox "Date of birth is not valid."
        Exit Sub
    End If

    Module1.UpdateCustomer CustomerId, txtFirstName.Text, txtLastName.Text, CDate(txtDateOfBirth.Text), txtInsuranceId.Text
    MsgBox "Customer updated."
    Unload Me
End Sub
