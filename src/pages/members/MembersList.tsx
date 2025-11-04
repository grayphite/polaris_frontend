import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';

import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateTime';
import { fetchInvitations, InvitationDTO, deleteInvitation } from '../../services/invitationService';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import Loader from '../../components/common/Loader';
import DeleteInvitationModal from '../../components/ui/DeleteInvitationModal';
import { useAuth } from '../../context/AuthContext';
import { useInvitations } from '../../context/InvitationsContext';

type TableRow = {
  id: string;
  email: string;
  status: 'active' | 'invited' | 'inactive' | 'expired' | 'cancelled';
  invitedAt: string;
};

const MembersList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<{ id: number; email?: string } | null>(null);
  const [owner, setOwner] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  
  // Get the openInviteModal function and inviteTimestamp from MainLayout context
  const { openInviteModal, inviteTimestamp } = useOutletContext<{ 
    openInviteModal: () => void;
    inviteTimestamp?: number;
  }>();
  
  // Get user role for permission checks
  const { user } = useAuth();
  const { setInvitationsResponse } = useInvitations();
  const isOwner = user?.role === 'owner';
  
  const mapStatus = (status: InvitationDTO['status']): TableRow['status'] => {
    if (status === 'pending') return 'invited';
    if (status === 'accepted') return 'active';
    if (status === 'declined') return 'inactive';
    if (status === 'expired') return 'expired';
    if (status === 'cancelled') return 'cancelled';
    return 'inactive';
  };

  const mapFilterStatusToApi = (frontendStatus: string): InvitationDTO['status'] | undefined => {
    if (frontendStatus === 'all') return undefined;
    if (frontendStatus === 'invited') return 'pending';
    if (frontendStatus === 'active') return 'accepted';
    if (frontendStatus === 'inactive') return 'declined';
    return undefined;
  };

  // Load team info from localStorage on mount and when invite timestamp changes
  useEffect(() => {
    const loadTeamInfo = () => {
      const storedTeamId = localStorage.getItem('teamId');
      const storedOwner = localStorage.getItem('teamOwner');

      if (storedTeamId) {
        setTeamId(storedTeamId);
        
        if (storedOwner) {
          try {
            const ownerInfo = JSON.parse(storedOwner);
            setOwner(ownerInfo);
          } catch (error) {
            console.error('Failed to parse stored owner data:', error);
            setOwner(null);
          }
        } else {
          setOwner(null);
        }
      } else {
        setTeamId(null);
        setOwner(null);
        setRows([]);
        setTotal(0);
        setInvitationsResponse(null);
      }
    };

    loadTeamInfo();
  }, [inviteTimestamp, setInvitationsResponse]);

  const loadInvitations = useCallback(async () => {
    if (!teamId) {
      setRows([]);
      setTotal(0);
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch all invitations (no filter) and store in context
      const allRes = await fetchInvitations({
        team_id: Number(teamId),
      });
      setInvitationsResponse(allRes);
      
      // Fetch filtered invitations for display
      const apiStatus = mapFilterStatusToApi(filterStatus);
      const res = await fetchInvitations({
        page,
        per_page: perPage,
        team_id: Number(teamId),
        status: apiStatus,
      });
      
      const mapped: TableRow[] = res.invitations.map((inv) => ({
        id: String(inv.id),
        email: inv.invited_email,
        status: mapStatus(inv.status),
        invitedAt: inv.invited_at,
      }));
      
      setRows(mapped);
      setTotal(res.pagination.total);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Failed to load invitations';
      showErrorToast(msg);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, page, perPage, filterStatus, setInvitationsResponse]);

  // Load invitations when dependencies change
  useEffect(() => {
    loadInvitations();
  }, [loadInvitations, inviteTimestamp]);

  const openDeleteModal = (id: number, email?: string) => {
    setInvitationToDelete({ id, email });
    setIsDeleteOpen(true);
  };

  const handleDeleteInvitation = async (invitationId: number) => {
    try {
      await deleteInvitation(invitationId);
      showSuccessToast('Invitation deleted');
      setIsDeleteOpen(false);
      setInvitationToDelete(null);
      await loadInvitations();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Failed to delete invitation';
      showErrorToast(msg);
      throw e;
    }
  };
  
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = row.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [rows, searchQuery]);
  
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        {isOwner && (
          <Button
            variant="primary"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            }
            onClick={openInviteModal}
          >
            Invite Member
          </Button>
        )}
      </div>
      {owner && (
        <div className="w-full md:w-[40%] bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Team Owner</p>
              <p className="text-base font-medium text-gray-900">{owner.first_name} {owner.last_name}</p>
              <a href={`mailto:${owner.email}`} className="text-sm text-primary-600 hover:text-primary-700">{owner.email}</a>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search members..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Members table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader size="lg" color="primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited At
                    </th>
                    {isOwner && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{row.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(row.status)}`}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(row.invitedAt)}
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* <button className="text-primary-600 hover:text-primary-900 mr-4">Edit</button> */}
                          {row.status !== 'inactive' && (
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => openDeleteModal(Number(row.id), row.email)}
                            >
                              Delete
                            </button>
                          )}
                          {row.status === 'inactive' && (
                            <button className="text-green-600 hover:text-green-900">Activate</button>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRows.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || filterStatus !== 'all'
                    ? "No members match your search criteria"
                    : "You haven't added any team members yet."}
                </p>
                {isOwner && (
                  <div className="mt-6">
                    <Button
                      variant="primary"
                      leftIcon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                      }
                      onClick={openInviteModal}
                    >
                      Invite Member
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DeleteInvitationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setInvitationToDelete(null);
        }}
        invitationId={invitationToDelete?.id || 0}
        invitationEmail={invitationToDelete?.email}
        onConfirm={handleDeleteInvitation}
      />
      
    </div>
  );
};

export default MembersList;

