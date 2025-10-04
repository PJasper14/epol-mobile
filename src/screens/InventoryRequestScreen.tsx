import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
  Divider,
  ActivityIndicator,
  Surface,
  List,
  IconButton,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SPACING, SHADOWS, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  unit: string;
}

interface RequestItem {
  inventory_item_id: string;
  quantity: number;
  itemName: string;
  unit: string;
  currentStock: number;
  threshold: number;
}

const InventoryRequestScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [allInventoryItems, setAllInventoryItems] = useState<InventoryItem[]>([]);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
 
  useEffect(() => {
    loadInventoryItems();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    setCurrentPage(1);
    loadInventoryItems();
  }, [searchQuery, selectedFilter]);

  const loadInventoryItems = async () => {
    await loadInventoryItemsForPage(currentPage);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadInventoryItems();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => {
    setSelectedFilter(filter);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadInventoryItemsForPage(nextPage);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      loadInventoryItemsForPage(prevPage);
    }
  };

  const loadInventoryItemsForPage = async (page: number) => {
    try {
      setLoading(true);
      
      // Get stock status filter
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | undefined;
      if (selectedFilter === 'low_stock') stockStatus = 'low_stock';
      else if (selectedFilter === 'out_of_stock') stockStatus = 'out_of_stock';
      else if (selectedFilter === 'in_stock') stockStatus = 'in_stock';
      
      // Call API to get inventory items
      const response = await apiService.getInventoryItems({
        search: searchQuery,
        stock_status: stockStatus,
        per_page: itemsPerPage,
        page: page
      });
      
      const apiItems = response.data || [];
      const totalPages = (response as any).last_page || 1;
      
      // Transform API data to match our interface
      const transformedItems: InventoryItem[] = apiItems.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        quantity: item.quantity,
        threshold: item.threshold,
        unit: item.unit
      }));
      
      setInventoryItems(transformedItems);
      setTotalPages(totalPages);
      
      // Set all items for dropdown (use API data if available, otherwise fallback to mock)
      setAllInventoryItems(transformedItems);
      

    } catch (error) {
      console.error('Error loading inventory items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity < item.threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) return COLORS.error;
    if (item.quantity < item.threshold) return COLORS.warning;
    return COLORS.success;
  };

  const getStockStatusIcon = (item: InventoryItem) => {
    if (item.quantity === 0) return 'error';
    if (item.quantity < item.threshold) return 'warning';
    return 'check-circle';
  };

  const addItemToRequest = () => {
    if (!selectedItem || !quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please select an item and enter a valid quantity');
      return;
    }

    const item = allInventoryItems.find(i => i.id === selectedItem);
    if (!item) return;

    // Check if item already exists in request
    const existingIndex = requestItems.findIndex(r => r.inventory_item_id === selectedItem);
    
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...requestItems];
      updatedItems[existingIndex].quantity += parseInt(quantity);
      setRequestItems(updatedItems);
    } else {
      // Add new item
      const newItem: RequestItem = {
        inventory_item_id: selectedItem,
        quantity: parseInt(quantity),
        itemName: item.name,
        unit: item.unit,
        currentStock: item.quantity,
        threshold: item.threshold
      };
      setRequestItems([...requestItems, newItem]);
    }

         // Reset form
     setSelectedItem('');
     setQuantity('1');
     setShowItemDropdown(false);
     setShowAddModal(false);
     setSearchQuery('');
  };

  const removeItemFromRequest = (index: number) => {
    setItemToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete !== null) {
      setRequestItems(requestItems.filter((_, i) => i !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    // Handle scroll events if needed
  };

  const submitRequest = async () => {
    if (requestItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the request');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the request');
      return;
    }

    setShowSubmitModal(true);
  };

  const confirmSubmitRequest = async () => {
    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const requestData = {
        items: requestItems.map(item => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity
        })),
        reason: reason.trim(),
        request_date: new Date().toISOString().split('T')[0]
      };

      // Submit to API
      const response = await apiService.submitInventoryRequest(requestData);

      Alert.alert(
        'Success',
        'Inventory request submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setRequestItems([]);
              setReason('');
              navigation.goBack();
            }
          }
        ]
        
      );

    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSuggestedItems = () => {
    // Use API data only - no fallback to mock data
    if (allInventoryItems.length === 0) {
      return [];
    }
    
    return allInventoryItems.filter(item => 
      item.quantity === 0 || item.quantity < item.threshold
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading inventory items...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >


        {/* Team Leader Inventory View */}
        {user?.role === 'team_leader' && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="inventory" size={20} color={COLORS.info} />
                <Title style={styles.sectionTitle}>Current Inventory Status</Title>
              </View>
              <Text style={styles.sectionSubtitle}>View all inventory items and stock levels</Text>
              
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  left={<TextInput.Icon icon="magnify" />}
                  right={searchQuery ? <TextInput.Icon icon="close" onPress={() => handleSearchChange('')} /> : undefined}
                  style={styles.searchInput}
                  outlineStyle={styles.inputOutline}
                />
              </View>
              
              {/* Filter Chips */}
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by status:</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilter === 'all' && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('all')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === 'all' && styles.filterChipTextActive
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilter === 'in_stock' && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('in_stock')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === 'in_stock' && styles.filterChipTextActive
                    ]}>
                      In Stock
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilter === 'low_stock' && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('low_stock')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === 'low_stock' && styles.filterChipTextActive
                    ]}>
                      Low Stock
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedFilter === 'out_of_stock' && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange('out_of_stock')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedFilter === 'out_of_stock' && styles.filterChipTextActive
                    ]}>
                      Out of Stock
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inventoryContainer}>
                {inventoryItems.map((item) => (
                  <View key={item.id} style={styles.inventoryItem}>
                    <View style={styles.inventoryItemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} {item.unit} (Threshold: {item.threshold})
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStockStatusColor(item) + '20' }
                      ]}
                      textStyle={{ 
                        color: getStockStatusColor(item),
                        fontWeight: '600',
                        lineHeight: 18,
                      }}
                    >
                      {getStockStatus(item)}
                    </Chip>
                  </View>
                ))}
                
                {/* Pagination Controls */}
                <View style={styles.paginationContainer}>
                  <View style={styles.paginationInfo}>
                    <Text style={styles.paginationText}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Text style={styles.paginationSubtext}>
                      {inventoryItems.length} items shown
                    </Text>
                  </View>
                  <View style={styles.paginationButtons}>
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        styles.previousButton,
                        currentPage === 1 && styles.paginationButtonDisabled
                      ]}
                      onPress={goToPreviousPage}
                      disabled={currentPage === 1}
                    >
                      <MaterialIcons 
                        name="chevron-left" 
                        size={20} 
                        color={currentPage === 1 ? COLORS.text.disabled : COLORS.primary} 
                      />
                      <Text style={[
                        styles.paginationButtonText,
                        currentPage === 1 && styles.paginationButtonTextDisabled
                      ]}>
                        Previous
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.paginationButton,
                        styles.nextButton,
                        currentPage === totalPages && styles.paginationButtonDisabled
                      ]}
                      onPress={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        currentPage === totalPages && styles.paginationButtonTextDisabled
                      ]}>
                        Next
                      </Text>
                      <MaterialIcons 
                        name="chevron-right" 
                        size={20} 
                        color={currentPage === totalPages ? COLORS.text.disabled : COLORS.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Suggested Items */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lightbulb" size={20} color={COLORS.warning} />
              <Title style={styles.sectionTitle}>Suggested Items</Title>
            </View>
            <Text style={styles.sectionSubtitle}>Items that are low or out of stock</Text>
            <View style={styles.suggestedContainer}>
              {getSuggestedItems().length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="check-circle" size={48} color={COLORS.success} />
                  <Text style={styles.emptyStateText}>All items are well stocked!</Text>
                </View>
              ) : (
                getSuggestedItems().map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestedItem}
                    onPress={() => {
                      setSelectedItem(item.id);
                      setQuantity(Math.max(1, item.threshold - item.quantity).toString());
                      setShowAddModal(true);
                    }}
                  >
                    <View style={styles.suggestedItemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>
                        Current: {item.quantity} {item.unit} (Threshold: {item.threshold})
                      </Text>
                    </View>
                    <View style={styles.suggestedItemActions}>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStockStatusColor(item) + '20' }
                      ]}
                      textStyle={{ 
                        color: getStockStatusColor(item),
                        fontWeight: '600',
                        lineHeight: 18,
                      }}
                    >
                      {getStockStatus(item)}
                    </Chip>
                      <MaterialIcons name="add-circle" size={24} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Add Items */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.addItemHeader}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="add-shopping-cart" size={20} color={COLORS.primary} />
              <Title style={styles.sectionTitle}>Request Items</Title>
              </View>
              <Button
                mode="contained"
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
                icon="plus"
                contentStyle={styles.addButtonContent}
              >
                Add Item
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Request Items List */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="list-alt" size={20} color={COLORS.info} />
            <Title style={styles.sectionTitle}>Request List</Title>
              <Chip style={styles.itemCountChip} textStyle={{ color: 'white' }}>
                {requestItems.length} item{requestItems.length !== 1 ? 's' : ''}
              </Chip>
            </View>
            {requestItems.length === 0 ? (
              <View style={styles.emptyRequestList}>
                <MaterialIcons name="shopping-cart" size={48} color={COLORS.text.disabled} />
                <Text style={styles.emptyRequestListText}>No items in request list</Text>
              </View>
            ) : (
              requestItems.map((item, index) => (
                <View key={index} style={styles.requestItem}>
                  <View style={styles.requestItemContent}>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItemFromRequest(index)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="delete-outline" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Reason */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={20} color={COLORS.secondary} />
            <Title style={styles.sectionTitle}>Reason for Request</Title>
            </View>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Explain why these items are needed..."
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
              outlineStyle={styles.inputOutline}
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={submitRequest}
          disabled={requestItems.length === 0 || !reason.trim() || submitting}
          style={styles.submitButton}
          loading={submitting}
          icon="send"
          contentStyle={styles.submitButtonContent}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </ScrollView>

      {/* Add Item Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <Surface style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="add-shopping-cart" size={24} color={COLORS.primary} />
                <Title style={styles.modalTitle}>Add Item to Request</Title>
              </View>
                             <IconButton
                 icon="close"
                 size={24}
                 onPress={() => {
                   setShowAddModal(false);
                   setShowItemDropdown(false);
                   setSearchQuery('');
                 }}
                 iconColor={COLORS.text.secondary}
               />
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Select Item</Text>
                <TouchableOpacity
                  style={styles.itemSelector}
                  onPress={() => {
                    setShowItemDropdown(!showItemDropdown);
                  }}
                >
                  {selectedItem ? (
                    <Text style={styles.selectedItemText}>
                      {allInventoryItems.find(i => i.id === selectedItem)?.name}
                    </Text>
                  ) : (
                    <Text style={styles.placeholderText}>Choose an item...</Text>
                  )}
                  <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
                
                {showItemDropdown && (
                  <>
                    <View style={styles.searchContainer}>
                      <TextInput
                        mode="outlined"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        left={<TextInput.Icon icon="magnify" />}
                        style={styles.searchInput}
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                    <ScrollView style={styles.itemDropdown}>
                      {allInventoryItems
                        .filter(item => 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.unit.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                                                 onPress={() => {
                           setSelectedItem(item.id);
                           setShowItemDropdown(false); // Close dropdown after selection
                           setSearchQuery(''); // Reset search query
                         }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                          <Text style={styles.dropdownItemDetails}>
                            {item.quantity} {item.unit} - {getStockStatus(item)}
                          </Text>
                        </View>
                        <MaterialIcons 
                          name={getStockStatusIcon(item)} 
                          size={16} 
                          color={getStockStatusColor(item)} 
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  </>
                )}
              </View>
              
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Quantity</Text>
              <TextInput
                mode="outlined"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.modalInput}
                  outlineStyle={styles.inputOutline}
                  right={<TextInput.Affix text={allInventoryItems.find(i => i.id === selectedItem)?.unit || ''} />}
              />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
                             <Button
                 mode="outlined"
                 onPress={() => {
                   setShowAddModal(false);
                   setShowItemDropdown(false);
                   setSearchQuery('');
                 }}
                 style={styles.modalButton}
                 contentStyle={styles.modalButtonContent}
               >
                 Cancel
               </Button>
              <Button
                mode="contained"
                onPress={addItemToRequest}
                disabled={!selectedItem || !quantity || parseInt(quantity) <= 0}
                style={styles.modalButton}
                contentStyle={styles.modalButtonContent}
                icon="plus"
              >
                Add Item
              </Button>
            </View>
          </Surface>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Portal>
          <Surface style={styles.dialogOverlay}>
            <Card style={styles.confirmationDialog}>
              <Card.Content>
                <Title style={styles.dialogTitle}>Remove Item</Title>
                <Text style={styles.dialogMessage}>
                  Are you sure you want to remove "{itemToDelete !== null ? requestItems[itemToDelete]?.itemName : ''}" from the request list?
                </Text>
                <View style={styles.dialogButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowDeleteModal(false);
                      setItemToDelete(null);
                    }}
                    style={styles.dialogButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={confirmDeleteItem}
                    style={[styles.dialogButton, styles.dialogButtonDanger]}
                    buttonColor={COLORS.error}
                  >
                    Remove
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Surface>
        </Portal>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <Portal>
          <Surface style={styles.dialogOverlay}>
            <Card style={styles.confirmationDialog}>
              <Card.Content>
                <Title style={styles.dialogTitle}>Submit Request</Title>
                <Text style={styles.dialogMessage}>
                  Are you sure you want to submit this inventory request? This action cannot be undone.
                </Text>
                <View style={styles.dialogSummary}>
                  <Text style={styles.dialogSummaryTitle}>Request Summary:</Text>
                  <Text style={styles.dialogSummaryText}>
                    • {requestItems.length} item{requestItems.length !== 1 ? 's' : ''} requested
                  </Text>
                  <Text style={styles.dialogSummaryText}>
                    • Reason: {reason.length > 50 ? reason.substring(0, 50) + '...' : reason}
                  </Text>
                </View>
                <View style={styles.dialogButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowSubmitModal(false)}
                    style={styles.dialogButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={confirmSubmitRequest}
                    style={[styles.dialogButton, styles.dialogButtonSuccess]}
                    buttonColor={COLORS.primary}
                    loading={submitting}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Surface>
        </Portal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.m,
  },

  card: {
    margin: SPACING.m,
    marginTop: SPACING.s,
    borderRadius: 16,
    ...SHADOWS.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingBottom: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    marginLeft: SPACING.s,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  inventoryContainer: {
    gap: SPACING.s,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
    marginBottom: SPACING.s,
  },
  inventoryItemContent: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: SPACING.m,
  },
  searchInput: {
    backgroundColor: 'white',
  },
  filterContainer: {
    marginBottom: SPACING.m,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  filterChip: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paginationContainer: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: SPACING.m,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  paginationText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  paginationSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  paginationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  previousButton: {
    flexDirection: 'row',
  },
  nextButton: {
    flexDirection: 'row-reverse',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: COLORS.divider,
    ...SHADOWS.small,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginHorizontal: SPACING.s,
  },
  paginationButtonTextDisabled: {
    color: COLORS.text.disabled,
  },
  suggestedContainer: {
    gap: SPACING.s,
  },
  suggestedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
    marginBottom: SPACING.s,
  },
  suggestedItemContent: {
    flex: 1,
  },
  suggestedItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statusChip: {
    paddingVertical: 4,
    minHeight: 28,
  },
  addItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  addButtonContent: {
    height: 40,
  },
  itemCountChip: {
    backgroundColor: COLORS.info,
    marginLeft: 'auto',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    marginBottom: SPACING.s,
  },
  requestItemContent: {
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: SPACING.s,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    marginLeft: SPACING.s,
  },
  emptyRequestList: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyRequestListText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyRequestListSubtext: {
    marginTop: SPACING.s,
    fontSize: 14,
    color: COLORS.text.disabled,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reasonInput: {
    marginTop: SPACING.s,
  },
  inputOutline: {
    borderRadius: 8,
  },
  submitButton: {
    margin: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    ...SHADOWS.large,
    elevation: 6,
  },
  submitButtonContent: {
    height: 56,
    paddingHorizontal: SPACING.xl,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.text.secondary,
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.m,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    ...SHADOWS.large,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    marginLeft: SPACING.s,
    fontSize: 18,
  },
  modalContent: {
    padding: SPACING.l,
    backgroundColor: '#FFFFFF',
  },
  modalInputContainer: {
    marginBottom: SPACING.m,
  },
  modalInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  itemSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  selectedItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.text.disabled,
  },
  modalInput: {
    backgroundColor: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: SPACING.s,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  modalButtonContent: {
    height: 40,
    paddingHorizontal: SPACING.m,
  },
  itemDropdown: {
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  dropdownItemDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  // Dialog styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  confirmationDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.l,
    ...SHADOWS.large,
  },
  dialogTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  dialogMessage: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.l,
    lineHeight: 22,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.s,
  },
  dialogButton: {
    minWidth: 80,
  },
  dialogButtonDanger: {
    // Additional danger button styles if needed
  },
  dialogSummary: {
    backgroundColor: '#F8F9FA',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
    marginVertical: SPACING.m,
  },
  dialogSummaryTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  dialogSummaryText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  dialogButtonSuccess: {
    // Additional success button styles if needed
  },
});

export default InventoryRequestScreen;
