VERSION 5.00
Begin VB.Form Form1
   Caption         =   "Customer Lookup"
   ClientHeight    =   3000
   ClientWidth     =   4500
   Begin VB.TextBox txtLastName
      Height          =   315
      Left            =   1200
      Top             =   360
   End
   Begin VB.CommandButton cmdSearch
      Caption         =   "Search"
      Height          =   375
      Left            =   1200
      Top             =   840
   End
End
Attribute VB_Name = "Form1"

Private Sub cmdSearch_Click()
    On Error Resume Next
    Dim customerId As Variant
    customerId = Module1.FindCustomerId(txtLastName.Text)
    MsgBox "Customer ID: " & customerId
End Sub
