import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReleaseTypeSelection } from './ReleaseTypeSelection';
import { ReleaseType, ReleaseData } from '../types';

interface NewReleaseFlowProps {
    editingRelease: ReleaseData | null;
    setEditingRelease: (release: ReleaseData | null) => void;
    onSaveRelease: (data: ReleaseData) => void;
}

export const NewReleaseFlow: React.FC<NewReleaseFlowProps> = ({ 
    editingRelease, 
    setEditingRelease, 
    onSaveRelease 
}) => {
    const navigate = useNavigate();

    useEffect(() => {
        setEditingRelease(null);
    }, [setEditingRelease]);

    const handleSelectType = (type: ReleaseType) => {
        const targetPath = type === 'SINGLE' 
            ? '/new-release/single' 
            : '/new-release/album';
        navigate(targetPath);
    };

    return <ReleaseTypeSelection onSelect={handleSelectType} />;
};
