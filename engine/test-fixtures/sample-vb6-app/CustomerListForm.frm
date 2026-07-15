VERSION 5.00
Begin VB.Form CustomerListForm
   Caption         =   "Customers"
   ClientHeight    =   3600
   ClientWidth     =   5400
   Begin VB.ListBox lstCustomers
      Height          =   2400
      Left            =   240
      Top             =   240
      Width           =   3600
   End
   Begin VB.CommandButton cmdAddNew
      Caption         =   "Add New"
      Height          =   375
      Left            =   4080
      Top             =   240
   End
   Begin VB.CommandButton cmdEdit
      Caption         =   "Edit"
      Height          =   375
      Left            =   4080
      Top             =   720
   End
   Begin VB.CommandButton cmdDelete
      Caption         =   "Delete"
      Height          =   375
      Left            =   4080
      Top             =   1200
   End
   Begin VB.CommandButton cmdRefresh
      Caption         =   "Refresh"
      Height          =   375
      Left            =   4080
      Top             =   1680
   End
End
Attribute VB_Name = "CustomerListForm"

' Parallel array: customerIds(i) is the database Id for lstCustomers.List(i).
Dim customerIds() As Long

Private Sub Form_Load()
    LoadCustomers
End Sub

Private Sub cmdRefresh_Click()
    LoadCustomers
End Sub

Private Sub LoadCustomers()
    Dim rs As Object
    Dim i As Integer

    Set rs = Module1.GetAllCustomers()
    lstCustomers.Clear

    i = 0
    ReDim customerIds(rs.RecordCount)
    Do While Not rs.EOF
        lstCustomers.AddItem rs.Fields("LastName").Value & ", " & rs.Fields("FirstName").Value & " (Id " & rs.Fields("Id").Value & ")"
        customerIds(i) = rs.Fields("Id").Value
        i = i + 1
        rs.MoveNext
    Loop
End Sub

Private Sub cmdAddNew_Click()
    CustomerAddForm.Show vbModal
    LoadCustomers
End Sub

Private Sub cmdEdit_Click()
    If lstCustomers.ListIndex < 0 Then
        MsgBox "Select a customer first."
        Exit Sub
    End If
    CustomerEditForm.CustomerId = customerIds(lstCustomers.ListIndex)
    CustomerEditForm.Show vbModal
    LoadCustomers
End Sub

Private Sub cmdDelete_Click()
    Dim confirm As Integer

    If lstCustomers.ListIndex < 0 Then
        MsgBox "Select a customer first."
        Exit Sub
    End If

    confirm = MsgBox("Delete this customer?", vbYesNo)
    If confirm = vbYes Then
        Module1.DeleteCustomer customerIds(lstCustomers.ListIndex)
        LoadCustomers
    End If
End Sub
