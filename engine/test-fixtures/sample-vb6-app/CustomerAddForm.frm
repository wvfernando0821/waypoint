VERSION 5.00
Begin VB.Form CustomerAddForm
   Caption         =   "Add Customer"
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
      Caption         =   "Save"
      Height          =   375
      Left            =   1200
      Top             =   1800
   End
End
Attribute VB_Name = "CustomerAddForm"

Private Sub cmdSave_Click()
    If Trim(txtFirstName.Text) = "" Or Trim(txtLastName.Text) = "" Then
        MsgBox "First and last name are required."
        Exit Sub
    End If

    If Not IsDate(txtDateOfBirth.Text) Then
        MsgBox "Date of birth is not valid."
        Exit Sub
    End If

    Module1.InsertCustomer txtFirstName.Text, txtLastName.Text, CDate(txtDateOfBirth.Text), txtInsuranceId.Text
    MsgBox "Customer saved."
    Unload Me
End Sub
