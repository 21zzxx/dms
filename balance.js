// Balance and Transaction Management System
// Shared utility functions for balance tracking across all pages

function getBalance(){
    const balance = localStorage.getItem('dmall_balance');
    return balance ? parseFloat(balance) : 1000; // Default starter balance: 1000 USDT
}

function setBalance(amount){
    localStorage.setItem('dmall_balance', parseFloat(amount).toFixed(2));
}

function addBalance(amount){
    const current = getBalance();
    setBalance(current + parseFloat(amount));
}

function subtractBalance(amount){
    const current = getBalance();
    const newBalance = current - parseFloat(amount);
    if(newBalance < 0) return false; // Insufficient balance
    setBalance(newBalance);
    return true;
}

// Get user ID (create if doesn't exist)
function getUserId(){
    let userId = localStorage.getItem('dmall_user_id');
    if(!userId){
        userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('dmall_user_id', userId);
    }
    return userId;
}

// Approval system functions
function getPendingRecharges(){
    const recharges = JSON.parse(localStorage.getItem('dmall_recharges') || '[]');
    return recharges.filter(r => r.status === 'pending');
}

function getPendingWithdrawals(){
    const withdraws = JSON.parse(localStorage.getItem('dmall_withdraws') || '[]');
    return withdraws.filter(w => w.status === 'pending');
}

function approveRecharge(rechargeId){
    const recharges = JSON.parse(localStorage.getItem('dmall_recharges') || '[]');
    const recharge = recharges.find(r => r.id === rechargeId);
    if(!recharge) return false;
    
    recharge.status = 'approved';
    recharge.approvedAt = new Date().toISOString();
    recharge.approvedBy = 'admin';
    
    // Update balance
    addBalance(recharge.amount);
    
    localStorage.setItem('dmall_recharges', JSON.stringify(recharges));
    
    // Log approval
    logApproval({
        type: 'recharge_approved',
        rechargeId: rechargeId,
        amount: recharge.amount,
        timestamp: new Date().toISOString()
    });
    
    return true;
}

function rejectRecharge(rechargeId){
    const recharges = JSON.parse(localStorage.getItem('dmall_recharges') || '[]');
    const recharge = recharges.find(r => r.id === rechargeId);
    if(!recharge) return false;
    
    recharge.status = 'rejected';
    recharge.rejectedAt = new Date().toISOString();
    recharge.rejectedBy = 'admin';
    
    localStorage.setItem('dmall_recharges', JSON.stringify(recharges));
    
    logApproval({
        type: 'recharge_rejected',
        rechargeId: rechargeId,
        amount: recharge.amount,
        timestamp: new Date().toISOString()
    });
    
    return true;
}

function approveWithdrawal(withdrawId){
    const withdraws = JSON.parse(localStorage.getItem('dmall_withdraws') || '[]');
    const withdraw = withdraws.find(w => w.id === withdrawId);
    if(!withdraw) return false;
    
    withdraw.status = 'approved';
    withdraw.approvedAt = new Date().toISOString();
    withdraw.approvedBy = 'admin';
    
    localStorage.setItem('dmall_withdraws', JSON.stringify(withdraws));
    
    logApproval({
        type: 'withdrawal_approved',
        withdrawId: withdrawId,
        amount: withdraw.amount,
        timestamp: new Date().toISOString()
    });
    
    return true;
}

function rejectWithdrawal(withdrawId){
    const withdraws = JSON.parse(localStorage.getItem('dmall_withdraws') || '[]');
    const withdraw = withdraws.find(w => w.id === withdrawId);
    if(!withdraw) return false;
    
    withdraw.status = 'rejected';
    withdraw.rejectedAt = new Date().toISOString();
    withdraw.rejectedBy = 'admin';
    
    // Refund balance since withdrawal was rejected
    addBalance(withdraw.amount);
    
    localStorage.setItem('dmall_withdraws', JSON.stringify(withdraws));
    
    logApproval({
        type: 'withdrawal_rejected',
        withdrawId: withdrawId,
        amount: withdraw.amount,
        timestamp: new Date().toISOString()
    });
    
    return true;
}

function logApproval(approval){
    const approvals = JSON.parse(localStorage.getItem('dmall_approvals') || '[]');
    approvals.push(approval);
    localStorage.setItem('dmall_approvals', JSON.stringify(approvals));
}

// Get all transactions for a user (for admin view)
function getAllTransactions(){
    const recharges = JSON.parse(localStorage.getItem('dmall_recharges') || '[]');
    const withdraws = JSON.parse(localStorage.getItem('dmall_withdraws') || '[]');
    const invests = JSON.parse(localStorage.getItem('dmall_invests') || '[]');
    
    const transactions = [];
    
    recharges.forEach(r => {
        transactions.push({
            id: r.id,
            type: 'recharge',
            amount: r.amount,
            status: r.status || 'pending',
            createdAt: r.createdAt,
            approvedAt: r.approvedAt,
            note: r.note
        });
    });
    
    withdraws.forEach(w => {
        transactions.push({
            id: w.id,
            type: 'withdraw',
            amount: w.amount,
            status: w.status || 'pending',
            createdAt: w.created,
            approvedAt: w.approvedAt,
            note: w.note
        });
    });
    
    invests.forEach(inv => {
        transactions.push({
            id: inv.id,
            type: 'investment',
            amount: inv.amount,
            status: inv.status,
            provider: inv.provider,
            createdAt: inv.createdAt,
            payoutAt: inv.payoutAt
        });
    });
    
    return transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
