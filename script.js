// Initialize the grids when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createGrid('mainBoard', 8, 8);
    createGrid('piece1', 5, 5);
    createGrid('piece2', 5, 5);
    createGrid('piece3', 5, 5);
    
    // Prevent double-tap zoom on mobile
    document.addEventListener('touchend', function(e) {
        const target = e.target;
        if (target.classList.contains('cell')) {
            e.preventDefault();
            toggleCell(target);
        }
    }, { passive: false });
});

// Create a grid with specified rows and columns
function createGrid(id, rows, cols) {
    const grid = document.getElementById(id);
    if (!grid) return; // Safety check
    
    grid.innerHTML = '';
    grid.style.display = 'grid';
    // Don't set grid template columns here since it's handled in CSS
    grid.style.width = 'fit-content';
    
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = Math.floor(i / cols);
        cell.dataset.col = i % cols;
        
        // Add click event listener to toggle cell selection
        cell.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCell(cell);
        });
        
        grid.appendChild(cell);
    }
}

// Toggle cell selection
function toggleCell(cell) {
    cell.classList.toggle('selected');
}

// Clear specific grid
function clearGrid(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const cells = grid.getElementsByClassName('cell');
    Array.from(cells).forEach(cell => {
        cell.classList.remove('selected');
    });
}

// Update main board with new state
function updateMainBoard(newBoardState) {
    const mainBoard = document.getElementById('mainBoard');
    if (!mainBoard) return;
    
    const cells = mainBoard.getElementsByClassName('cell');
    Array.from(cells).forEach((cell, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        cell.classList.remove('selected');
        // Consider any non-zero value as selected
        if (newBoardState[row][col] > 0) {
            cell.classList.add('selected');
        }
    });
    
    // Clear piece grids
    clearGrid('piece1');
    clearGrid('piece2');
    clearGrid('piece3');
    
    // Scroll to main board
    mainBoard.scrollIntoView({ behavior: 'smooth' });
}

// Get the current state of a grid
function getGridState(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return null;
    
    const cells = grid.getElementsByClassName('cell');
    const rows = gridId === 'mainBoard' ? 8 : 5;
    const cols = gridId === 'mainBoard' ? 8 : 5;
    const state = Array(rows).fill().map(() => Array(cols).fill(0));
    
    Array.from(cells).forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        state[row][col] = cell.classList.contains('selected') ? 1 : 0;
    });
    
    return state;
}

// Extract piece pattern from piece grid
function extractPiece(gridId) {
    const state = getGridState(gridId);
    if (!state) return [];
    
    let piece = [];
    let minRow = 5, maxRow = -1, minCol = 5, maxCol = -1;
    
    // Find the boundaries of the piece
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (state[i][j] === 1) {
                minRow = Math.min(minRow, i);
                maxRow = Math.max(maxRow, i);
                minCol = Math.min(minCol, j);
                maxCol = Math.max(maxCol, j);
            }
        }
    }
    
    // Extract the piece pattern
    if (maxRow >= 0) {
        for (let i = minRow; i <= maxRow; i++) {
            let row = [];
            for (let j = minCol; j <= maxCol; j++) {
                row.push(state[i][j]);
            }
            piece.push(row);
        }
    }
    
    return piece;
}

// Create a deep copy of a board
function copyBoard(board) {
    return board.map(row => [...row]);
}

// Check if a piece can be placed at a specific position
function canPlacePiece(board, piece, row, col) {
    if (!piece.length) return false;
    
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[0].length; j++) {
            if (piece[i][j] === 1) {
                const newRow = row + i;
                const newCol = col + j;
                
                if (newRow >= board.length || newCol >= board[0].length || 
                    board[newRow][newCol] !== 0) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Place a piece on the board
function placePiece(board, piece, row, col, pieceIndex) {
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[0].length; j++) {
            if (piece[i][j] === 1) {
                board[row + i][col + j] = pieceIndex + 2;
            }
        }
    }
}

// Clear completed lines and return new board state
function clearLines(board) {
    const rows = board.length;
    const cols = board[0].length;
    let clearedLines = { rows: [], cols: [] };
    
    // Find completed rows and columns
    for (let i = 0; i < rows; i++) {
        if (board[i].every(cell => cell !== 0)) {
            clearedLines.rows.push(i);
        }
    }
    
    for (let j = 0; j < cols; j++) {
        if (board.every(row => row[j] !== 0)) {
            clearedLines.cols.push(j);
        }
    }
    
    // If no lines to clear, return original board
    if (clearedLines.rows.length === 0 && clearedLines.cols.length === 0) {
        return { newBoard: board, clearedLines };
    }
    
    // Create new board after clearing lines
    let newBoard = copyBoard(board);
    
    // Clear rows
    clearedLines.rows.forEach(rowIndex => {
        newBoard[rowIndex] = Array(cols).fill(0);
    });
    
    // Clear columns
    clearedLines.cols.forEach(colIndex => {
        for (let i = 0; i < rows; i++) {
            newBoard[i][colIndex] = 0;
        }
    });
    
    return { newBoard, clearedLines };
}

// Create a visual representation of the board
function createBoardVisual(board, completedLines = null) {
    const visual = document.createElement('div');
    visual.className = 'solution-grid';
    
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = getColorForValue(board[i][j]);
            
            // Highlight completed lines
            if (completedLines && 
                (completedLines.rows.includes(i) || completedLines.cols.includes(j))) {
                cell.style.opacity = '0.5';
            }
            
            visual.appendChild(cell);
        }
    }
    return visual;
}

// Get color for board value
function getColorForValue(value) {
    switch(value) {
        case 0: return 'rgba(255, 255, 255, 0.05)';
        case 1: return 'rgba(255, 255, 255, 0.2)'; // blocked cells
        case 2: return '#00c3ff'; // piece 1
        case 3: return '#0066ff'; // piece 2
        case 4: return '#00ffaa'; // piece 3
        default: return 'rgba(255, 255, 255, 0.05)';
    }
}

// Find best solution considering line clears
function findBestSolution(board, pieces) {
    let bestSolution = null;
    let maxScore = -1;
    const initialBoard = copyBoard(board);

    function solve(currentBoard, availablePieces, currentSolution = [], totalLinesCleared = 0) {
        // Calculate score based on total lines cleared and remaining pieces
        const currentScore = totalLinesCleared * 100 - availablePieces.length;
        
        // Update best solution if this one has a better score
        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestSolution = [...currentSolution];
        }
        
        // Try each available piece in each possible position
        for (let pieceIndex = 0; pieceIndex < availablePieces.length; pieceIndex++) {
            const piece = availablePieces[pieceIndex];
            if (!piece.length) continue;
            
            for (let row = 0; row <= currentBoard.length - piece.length; row++) {
                for (let col = 0; col <= currentBoard[0].length - piece[0].length; col++) {
                    if (canPlacePiece(currentBoard, piece, row, col)) {
                        // Create new board with this piece placement
                        const nextBoard = copyBoard(currentBoard);
                        placePiece(nextBoard, piece, row, col, pieceIndex);
                        
                        // Check for and clear any completed lines
                        const { newBoard, clearedLines } = clearLines(nextBoard);
                        const linesCleared = clearedLines.rows.length + clearedLines.cols.length;
                        
                        // Remove the used piece from available pieces
                        const nextPieces = [...availablePieces];
                        nextPieces.splice(pieceIndex, 1);
                        
                        // Add this move to current solution
                        currentSolution.push({
                            pieceIndex,
                            row,
                            col,
                            boardState: copyBoard(nextBoard),
                            boardAfterClearing: copyBoard(newBoard),
                            clearedLines,
                            linesCleared
                        });
                        
                        // Continue solving with remaining pieces on the cleared board
                        solve(newBoard, nextPieces, currentSolution, totalLinesCleared + linesCleared);
                        
                        // Backtrack
                        currentSolution.pop();
                    }
                }
            }
        }
    }

    solve(initialBoard, pieces);
    return bestSolution;
}

// Main solve function
function solvePuzzle() {
    const board = getGridState('mainBoard');
    if (!board) return;
    
    const pieces = [
        extractPiece('piece1'),
        extractPiece('piece2'),
        extractPiece('piece3')
    ].filter(piece => piece.length > 0);
    
    if (pieces.length === 0) {
        const solutionDiv = document.getElementById('solution');
        if (solutionDiv) {
            solutionDiv.innerHTML = '<h3>Please select at least one piece to solve!</h3>';
            solutionDiv.classList.add('visible');
        }
        return;
    }
    
    const solution = findBestSolution(board, pieces);
    const solutionDiv = document.getElementById('solution');
    if (!solutionDiv) return;
    
    solutionDiv.innerHTML = '';
    
    if (solution && solution.length > 0) {
        let instructions = '<h3>Solution Found!</h3>';
        instructions += '<div class="solution-steps">';
        
        // Show initial board
        instructions += '<div class="solution-step">';
        instructions += '<h4>Initial Board</h4>';
        solutionDiv.innerHTML = instructions;
        solutionDiv.appendChild(createBoardVisual(board));
        
        // Show each step
        solution.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'solution-step';
            
            stepDiv.innerHTML = `
                <h4>Step ${index + 1}: Place piece ${step.pieceIndex + 1}</h4>
                <p>Position: Row ${step.row + 1}, Column ${step.col + 1}</p>
            `;
            
            // Show board after piece placement
            stepDiv.appendChild(createBoardVisual(step.boardState, step.clearedLines));
            
            // If lines were cleared, show the clearing information and resulting board
            if (step.linesCleared > 0) {
                const clearingInfo = document.createElement('div');
                clearingInfo.className = 'lines-info';
                clearingInfo.innerHTML = `<p class="lines-cleared">Lines cleared: ${step.linesCleared}</p>`;
                
                if (step.clearedLines.rows.length > 0) {
                    clearingInfo.innerHTML += `<p>Rows cleared: ${step.clearedLines.rows.map(r => r + 1).join(', ')}</p>`;
                }
                if (step.clearedLines.cols.length > 0) {
                    clearingInfo.innerHTML += `<p>Columns cleared: ${step.clearedLines.cols.map(c => c + 1).join(', ')}</p>`;
                }
                
                stepDiv.appendChild(clearingInfo);
                
                // Show board after clearing
                const afterClearingDiv = document.createElement('div');
                afterClearingDiv.className = 'after-clearing';
                afterClearingDiv.innerHTML = '<h5>Board after clearing lines:</h5>';
                afterClearingDiv.appendChild(createBoardVisual(step.boardAfterClearing));
                stepDiv.appendChild(afterClearingDiv);
            }
            
            solutionDiv.appendChild(stepDiv);
        });
        
        instructions += '</div>';
        
        // Add final board state and continue button
        const finalStep = solution[solution.length - 1];
        const finalBoard = finalStep.linesCleared > 0 ? finalStep.boardAfterClearing : finalStep.boardState;
        
        const finalStepDiv = document.createElement('div');
        finalStepDiv.className = 'solution-step';
        finalStepDiv.innerHTML = '<h4>Final Board</h4>';
        finalStepDiv.appendChild(createBoardVisual(finalBoard));
        
        const continueButton = document.createElement('button');
        continueButton.className = 'continue-btn';
        continueButton.textContent = 'Continue with this board';
        continueButton.onclick = () => updateMainBoard(finalBoard);
        finalStepDiv.appendChild(continueButton);
        
        solutionDiv.appendChild(finalStepDiv);
    } else {
        solutionDiv.innerHTML = `
            <h3>No solution found!</h3>
            <p>Make sure all pieces and blocked positions are correctly marked.</p>
        `;
    }
    
    solutionDiv.classList.add('visible');
    
    if (window.innerWidth <= 768) {
        solutionDiv.scrollIntoView({ behavior: 'smooth' });
    }
}
