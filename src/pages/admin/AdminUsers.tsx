// @ts-nocheck - TODO: Fix type issues with styled-components theme
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, Button, Pagination, Loader, Badge } from '../../components/ui';
import { AdminInput, EnhancedCheckbox, AdminDropdown } from '../../components/admin/StyledFormControls';
import supabase, { supabaseAdmin } from "../../config/supabaseClient";
import { useThemeContext } from '../../App';
import UserForm from '../../components/admin/UserForm';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { FaAngleLeft, FaAngleRight, FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';

// Define user type with optional fields to handle different tables
interface User {
  id: string;
  email?: string;
  full_name?: string;
  name?: string; // Alternative field name
  first_name?: string; // Alternative field name
  last_name?: string; // Alternative field name
  username?: string; // Alternative field name
  role?: string;
  user_role?: string; // Alternative field name
  /**
   * is_active ishlatmela
   */
  is_active?: boolean;
  active?: boolean; // Alternative field name
  status?: string; // Alternative field name
  last_login?: string | null;
  last_sign_in_at?: string | null; // Alternative field name
  created_at?: string;
  updated_at?: string;
}

// User deletion helper function
async function deleteUser(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    console.error('Error deleting user from auth:', error)
    throw error
  } else {
    console.log('User successfully deleted from auth:', data)
    return data
  }
}

const AdminUsers: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const { isDarkMode } = useThemeContext();

  // Add state for UserForm
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Partial<User> | undefined>(undefined);
  const [formTitle, setFormTitle] = useState("Create New User");

  // Add state for success messages at the top with other state definitions
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add state for bulk delete modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Show success message for 5 seconds
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Define fetchUsers outside of useEffect so it can be called elsewhere
  const fetchUsers = async () => {
    try {
      console.log('Starting to fetch users from Supabase...');
      setIsLoading(true);

      // First try 'users' table
      console.log('Trying to fetch from "users" table...');
      let { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      console.log('users table response:', { data: usersData, error: usersError });

      // If that fails, try 'user' table
      if (usersError) {
        console.log('Trying to fetch from "user" table instead...');
        let { data: userData, error: userError } = await supabase
          .from('user')
          .select('*');

        console.log('user table response:', { data: userData, error: userError });

        if (!userError) {
          usersData = userData;
          usersError = null;
        }
      }

      // Try 'profiles' table as a last resort
      if (usersError) {
        console.log('Trying to fetch from "profiles" table as last resort...');
        let { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        console.log('profiles table response:', { data: profilesData, error: profilesError });

        if (!profilesError) {
          usersData = profilesData;
          usersError = null;
        }
      }

      if (usersError) {
        console.error('Error fetching users from all tried tables:', usersError);
        return;
      }

      if (usersData && usersData.length > 0) {
        console.log('Fetched users successfully:', usersData);
        console.log('Number of users fetched:', usersData.length);
        setUsers(usersData);
      } else {
        console.log('No data returned from Supabase (data is null or empty)');
      }
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper to get display name from various possible fields
  const getDisplayName = (user: User): string => {
    if (user.full_name) return user.full_name;
    if (user.name) return user.name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'Unknown User';
  };

  // Helper to get email
  const getEmail = (user: User): string => {
    return user.email || 'No email';
  };

  // Helper to get role
  const getRole = (user: User): string => {
    return user.role || user.user_role || 'Student';
  };

  // Helper to determine if user is active
  const isUserActive = (user: User): boolean => {
    if (typeof user.status === 'string') return user.status === 'active';
    if (user.status === 'active') return true;
    if (user.status === 'inactive') return false;
    return true; // Default to active
  };

  // Helper to get last login date
  const getLastLogin = (user: User): string | null => {
    return user.last_login || user.last_sign_in_at || null;
  };

  // Helper to get registration date
  const getCreatedAt = (user: User): string | null => {
    return user.created_at || user.updated_at || null;
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter((user) => {
    const displayName = getDisplayName(user).toLowerCase();
    const email = getEmail(user).toLowerCase();

    const matchesSearch =
      searchTerm === '' ||
      displayName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === null || getRole(user) === roleFilter;
    const matchesStatus =
      statusFilter === null ||
      (statusFilter === 'Active' && isUserActive(user)) ||
      (statusFilter === 'Inactive' && !isUserActive(user));

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((user) => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10b981';
      case 'Inactive':
        return '#ef4444';
      case 'Pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Add function to handle form submission
  const handleUserFormSubmit = async (userData: Partial<User>) => {
    console.log("User form submitted:", userData);

    // If we have an ID, it's an update operation
    if (userData.id) {
      try {
        console.log("Updating user:", userData);

        // Format the update data with the most commonly used field names
        const updateData = {
          // Use standard field names
          email: userData.email,
          role: userData.role,
          updated_at: new Date().toISOString(),

          // Use name or first_name/last_name depending on what might be in the database
          ...(userData.firstName && userData.lastName ? {
            first_name: userData.firstName,
            last_name: userData.lastName,
            name: `${userData.firstName} ${userData.lastName}`,
            full_name: `${userData.firstName} ${userData.lastName}`
          } : {}),

          // Also include camelCase versions
          ...(userData.firstName ? { firstName: userData.firstName } : {}),
          ...(userData.lastName ? { lastName: userData.lastName } : {}),

          // Handle status field with multiple formats
          ...(userData.status ? {
            status: userData.status,
            is_active: userData.status === 'active',
            active: userData.status === 'active'
          } : {})
        };

        console.log("Attempting to update user in database:", updateData);

        // Try to update in 'users' table
        let { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userData.id);

        if (error) {
          console.error("Failed to update user:", error);
          return;
        }

        console.log("User successfully updated in database");

        // Update the user in the local state for immediate UI refresh
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userData.id
              ? {
                  ...user,
                  ...userData,
                  // Ensure these specific fields are set correctly
                  firstName: userData.firstName || user.firstName,
                  lastName: userData.lastName || user.lastName,
                  email: userData.email || user.email,
                  role: userData.role || user.role,
                  status: userData.status || user.status
                }
              : user
          )
        );

        // Show success message
        showSuccessMessage(`User ${getDisplayName(userData)} was successfully updated`);
      } catch (err) {
        console.error("Error updating user:", err);
      }
    } else {
      // For newly created users, add them to the users array
      // The complete user data should come from the form submission
      if (userData.id) {
        console.log("Adding new user to the list:", userData);

        // Create a properly formatted user object
        const newUser: User = {
          id: userData.id,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          role: userData.role || 'Student',
          status: userData.status as 'active' | 'inactive' || 'active',
          lastLogin: 'Never',
          createdAt: new Date().toISOString(),
          // Add any other required fields with default values
        };

        // Add the new user to the state
        setUsers(prevUsers => [...prevUsers, newUser]);

        // Show success message
        showSuccessMessage(`User ${userData.firstName} ${userData.lastName} was successfully created`);
      }
    }

    // Close the form
    setIsUserFormOpen(false);
    setUserToEdit(undefined);
  };

  // Add function to open form for creating a new user
  const handleAddNewUser = () => {
    setUserToEdit(undefined);
    setFormTitle("Create New User");
    setIsUserFormOpen(true);
  };

  // Add function to open form for editing a user
  const handleEditUser = (user: User) => {
    console.log("Opening edit form for user:", user);

    // Create a properly formatted user object for editing
    // This ensures all required fields are present in the form
    const formattedUser = {
      id: user.id,
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      email: user.email || '',
      role: getRole(user),
      status: isUserActive(user) ? 'active' : 'inactive'
    };

    setUserToEdit(formattedUser);
    setFormTitle(`Edit User: ${getDisplayName(user)}`);
    setIsUserFormOpen(true);
  };

  // Function to open delete confirmation modal
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Function to cancel deletion
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  // Function to confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      console.log("Deleting user:", userToDelete.id);

      // Delete from auth system using Admin API
      try {
        await deleteUser(userToDelete.id);
      } catch (authErr) {
        console.log("Auth deletion attempt failed:", authErr);
        // Continue with public.users deletion even if auth deletion fails
      }

      // Delete from Supabase public.users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (error) {
        console.error("Error deleting user from public.users:", error);
        setSuccessMessage(`Error: ${error.message}`);
      } else {
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));

        // Show success message
        showSuccessMessage(`User ${getDisplayName(userToDelete)} was successfully deleted`);
      }
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Function to open bulk delete modal
  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Function to cancel bulk deletion
  const handleCancelBulkDelete = () => {
    setIsBulkDeleteModalOpen(false);
  };

  // Function to confirm and execute bulk deletion
  const handleConfirmBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    setIsBulkDeleting(true);

    try {
      console.log("Bulk deleting users:", selectedUsers);

      // Track successful and failed deletions
      const results = { success: 0, failed: 0 };

      // Delete each selected user
      for (const userId of selectedUsers) {
        // Delete from auth system using Admin API
        try {
          await deleteUser(userId);
        } catch (authErr) {
          console.log(`Auth deletion attempt for user ${userId} failed:`, authErr);
        }

        // Then delete from public.users
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error(`Error deleting user ${userId}:`, error);
          results.failed++;
        } else {
          results.success++;
        }
      }

      // Update the success message
      if (results.success > 0) {
        // Remove deleted users from the state
        setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user.id)));

        // Clear selection
        setSelectedUsers([]);

        // Show success message
        showSuccessMessage(
          `Successfully deleted ${results.success} user${results.success !== 1 ? 's' : ''}${
            results.failed > 0 ? ` (${results.failed} failed)` : ''
          }`
        );
      } else if (results.failed > 0) {
        setSuccessMessage(`Failed to delete any users. Please try again.`);
      }
    } catch (err) {
      console.error("Unexpected error during bulk deletion:", err);
      setSuccessMessage(`An unexpected error occurred during deletion.`);
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoaderContainer>
          <Loader size={50} />
        </LoaderContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <h1>User Management</h1>
          <HeaderActions>
            <Button variant="primary" size="md" onClick={handleAddNewUser}>
              <i className="fas fa-plus"></i> Add New User
            </Button>
          </HeaderActions>
        </Header>

        {successMessage && (
          <SuccessAlert>
            <i className="fas fa-check-circle"></i>
            <span>{successMessage}</span>
            <CloseButton onClick={() => setSuccessMessage(null)}>
              <i className="fas fa-times"></i>
            </CloseButton>
          </SuccessAlert>
        )}

        <FilterSection>
          <SearchContainer>
            <AdminInput
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<i className="fas fa-search"></i>}
            />
          </SearchContainer>
          <FiltersContainer>
            <AdminDropdown
              label="Role"
              value={roleFilter || 'All Roles'}
              onChange={(value) => setRoleFilter(value === 'All Roles' ? null : value)}
              options={['All Roles', 'Student', 'Teacher', 'Admin']}
            />
            <AdminDropdown
              label="Status"
              value={statusFilter || 'All Statuses'}
              onChange={(value) => setStatusFilter(value === 'All Statuses' ? null : value)}
              options={['All Statuses', 'Active', 'Inactive', 'Pending']}
            />
          </FiltersContainer>
        </FilterSection>

        <ActionsBar>
          <div>
            {selectedUsers.length > 0 && (
              <>
                <span>{selectedUsers.length} users selected</span>
                <Button variant="outline" size="sm">
                  <i className="fas fa-envelope"></i> Email
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                  <i className="fas fa-trash-alt"></i> Delete
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" size="sm">
            <i className="fas fa-download"></i> Export
          </Button>
        </ActionsBar>

        <TableCard>
          <Table>
            <THead>
              <TR>
                <TH width="40px">
                  <EnhancedCheckbox
                    checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                    onChange={handleSelectAll}
                  />
                </TH>
                <TH>User</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Last Login</TH>
                <TH>Registered</TH>
                <TH width="80px">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <TR key={user.id}>
                    <TD>
                      <EnhancedCheckbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TD>
                    <TD>
                      <UserInfo>
                        <UserAvatar>
                          {getDisplayName(user).split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                        </UserAvatar>
                        <UserDetails>
                          <UserName>{getDisplayName(user)}</UserName>
                          <UserEmail>{getEmail(user)}</UserEmail>
                        </UserDetails>
                      </UserInfo>
                    </TD>
                    <TD>
                      <Badge $role={getRole(user)}>{getRole(user)}</Badge>
                    </TD>
                    <TD>
                      <StatusBadge $color={getStatusColor(isUserActive(user) ? 'Active' : 'Inactive')}>
                        {isUserActive(user) ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </TD>
                    <TD>{formatDate(getLastLogin(user))}</TD>
                    <TD>{formatDate(getCreatedAt(user))}</TD>
                    <TD>
                      <ActionButtons>
                        <ActionButton
                          aria-label="Edit user"
                          onClick={() => handleEditUser(user)}
                        >
                          <i className="fas fa-edit"></i>
                        </ActionButton>
                        <ActionButton aria-label="Delete user" onClick={() => handleDeleteUser(user)}>
                          <i className="fas fa-trash-alt"></i>
                        </ActionButton>
                      </ActionButtons>
                    </TD>
                  </TR>
                ))
              ) : (
                <TR>
                  <EmptyTD colSpan={7}>
                    <EmptyState>
                      <i className="fas fa-search"></i>
                      <p>No users found matching your criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter(null);
                          setStatusFilter(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    </EmptyState>
                  </EmptyTD>
                </TR>
              )}
            </TBody>
          </Table>
        </TableCard>

        {/* Add the UserForm */}
        <UserForm
          isOpen={isUserFormOpen}
          onClose={() => setIsUserFormOpen(false)}
          onSubmit={handleUserFormSubmit}
          initialData={userToEdit}
          formTitle={formTitle}
        />

        {filteredUsers.length > 0 && (
          <PaginationContainer>
            <div>
              Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </PaginationContainer>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && userToDelete && (
          <ModalOverlay>
            <DeleteModal>
              <ModalHeader>
                <h3>Delete User</h3>
                <CloseButton onClick={handleCancelDelete}>
                  <i className="fas fa-times"></i>
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                <DeleteWarningIcon>
                  <i className="fas fa-exclamation-triangle"></i>
                </DeleteWarningIcon>

                <DeleteWarningText>
                  <p>Are you sure you want to delete <strong>{getDisplayName(userToDelete)}</strong>?</p>
                  <p>This action cannot be undone.</p>
                </DeleteWarningText>
              </ModalContent>

              <ModalFooter>
                <CancelButton onClick={handleCancelDelete}>
                  Cancel
                </CancelButton>
                <DeleteButton
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </DeleteButton>
              </ModalFooter>
            </DeleteModal>
          </ModalOverlay>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {isBulkDeleteModalOpen && selectedUsers.length > 0 && (
          <ModalOverlay>
            <DeleteModal>
              <ModalHeader>
                <h3>Delete Multiple Users</h3>
                <CloseButton onClick={handleCancelBulkDelete}>
                  <i className="fas fa-times"></i>
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                <DeleteWarningIcon>
                  <i className="fas fa-exclamation-triangle"></i>
                </DeleteWarningIcon>

                <DeleteWarningText>
                  <p>Are you sure you want to delete <strong>{selectedUsers.length} users</strong>?</p>
                  <p>This action cannot be undone and will permanently remove the users from the system.</p>
                </DeleteWarningText>
              </ModalContent>

              <ModalFooter>
                <CancelButton onClick={handleCancelBulkDelete}>
                  Cancel
                </CancelButton>
                <DeleteButton
                  onClick={handleConfirmBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : `Delete ${selectedUsers.length} Users`}
                </DeleteButton>
              </ModalFooter>
            </DeleteModal>
          </ModalOverlay>
        )}
      </PageContainer>
    </AdminLayout>
  );
};

// Styled components
const PageContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 28px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  div {
    display: flex;
    align-items: center;
    gap: 12px;
    span {
      color: ${({ theme }) => theme.colors.text};
      margin-right: 8px;
    }
  }
`;

const TableCard = styled(Card)`
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const THead = styled.thead`
  background-color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TBody = styled.tbody`
  & > tr:nth-child(even) {
    background-color: ${({ theme }) =>
      theme.isDark
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)'
    };
  }
`;

const TR = styled.tr`
  &:hover {
    background-color: ${({ theme }) =>
      theme.isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.04)'
    } !important;
  }
`;

const TH = styled.th<{ width?: string }>`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  width: ${({ width }) => width || 'auto'};
`;

const TD = styled.td`
  padding: 16px;
  font-size: 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyTD = styled.td`
  padding: 48px 16px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: ${({ theme }) => theme.colors.text};

  i {
    font-size: 36px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 16px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.colors.text};
`;

const UserEmail = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

const Badge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ $role }) => {
    switch ($role) {
      case 'Admin':
        return '#9d4edd';
      case 'Teacher':
        return '#4cc9f0';
      case 'Student':
        return '#4361ee';
      default:
        return '#e2e8f0';
    }
  }};
  color: white;
`;

const StatusBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ $color }) => $color + '20'};
  color: ${({ $color }) => $color};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardSecondary};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const SuccessAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 24px;
  background-color: #ecfdf5;
  border-left: 4px solid #10b981;
  border-radius: 4px;
  color: #065f46;

  i {
    font-size: 18px;
    color: #10b981;
  }

  span {
    flex: 1;
  }

  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;

  &:hover {
    color: #374151;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const DeleteModal = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  animation: modalFadeIn 0.3s ease-out;

  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const DeleteWarningIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ffe4e4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    color: #ef4444;
    font-size: 24px;
  }
`;

const DeleteWarningText = styled.div`
  p {
    margin: 0;
    color: #4b5563;

    &:first-child {
      margin-bottom: 8px;
      font-weight: 500;
      color: #1f2937;
    }
  }
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const DeleteButton = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background-color: #ef4444;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #dc2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default AdminUsers;